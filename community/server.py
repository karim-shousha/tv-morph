"""Small same-origin community API. All state lives in the mounted data directory."""
import contextlib
import hashlib
import hmac
import http.cookies
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs

DATA = Path(os.environ.get('MORPH_DATA_DIR', '/data'))
ROOT = Path(os.environ.get('MORPH_SITE_ROOT', '/usr/share/nginx/html'))
ORIGIN = os.environ.get('MORPH_PUBLIC_ORIGIN', 'https://morphtv.herroshetta.com').rstrip('/')
SECURE = ORIGIN.startswith('https://')
DATA.mkdir(parents=True, exist_ok=True)
os.chmod(DATA, 0o700)
secret_path = DATA / 'site-secret'
try:
    fd = os.open(secret_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
except FileExistsError:
    pass
else:
    with os.fdopen(fd, 'wb') as stream:
        stream.write(secrets.token_bytes(32))
SECRET = secret_path.read_bytes()
if len(SECRET) != 32:
    raise RuntimeError('Invalid persistent site secret')
DB = DATA / 'community.sqlite3'
from plus import Plus
PLUS = Plus(DATA, SECRET, ORIGIN)
from sports import Sports
SPORTS = Sports(DATA)


@contextlib.contextmanager
def database():
    db = sqlite3.connect(DB, timeout=8)
    db.row_factory = sqlite3.Row
    try:
        with db:
            yield db
    finally:
        db.close()


with database() as db:
    db.execute('PRAGMA journal_mode=WAL')
    db.executescript('''
        CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS downloads (platform TEXT PRIMARY KEY, total INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS download_seen (key TEXT PRIMARY KEY, seen_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY, visitor TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            comment TEXT NOT NULL DEFAULT '', state TEXT NOT NULL DEFAULT 'pending',
            rating_visible INTEGER NOT NULL DEFAULT 1,
            created INTEGER NOT NULL, updated INTEGER NOT NULL, approved INTEGER);
        CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS moderation (id INTEGER PRIMARY KEY, review_id INTEGER, action TEXT, created INTEGER);
    ''')
    db.execute("INSERT OR IGNORE INTO meta VALUES ('started', ?)", (str(int(time.time())),))
    # Retire sessions issued on the accidentally assigned apex domain. Keep the
    # password, licenses, community data and subsequent subdomain sessions intact.
    if not db.execute("SELECT 1 FROM meta WHERE key='admin-subdomain-reset-v1'").fetchone():
        db.execute('DELETE FROM admin_sessions')
        db.execute("INSERT INTO meta VALUES ('admin-subdomain-reset-v1', ?)", (str(int(time.time())),))
os.chmod(DB, 0o600)


def digest(value):
    return hmac.new(SECRET, value.encode('utf-8'), hashlib.sha256).hexdigest()


def limited(key, maximum, seconds):
    now = int(time.time())
    with database() as db:
        db.execute('BEGIN IMMEDIATE')
        db.execute('DELETE FROM limits WHERE expires < ?', (now,))
        row = db.execute('SELECT hits FROM limits WHERE key = ?', (key,)).fetchone()
        if row and row['hits'] >= maximum:
            return True
        db.execute('INSERT INTO limits VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1',
                   (key, now + seconds))
    return False


def summary(db):
    ratings = db.execute('SELECT COUNT(*) AS count, AVG(rating) AS average FROM reviews WHERE rating_visible = 1').fetchone()
    downloads = {row['platform']: row['total'] for row in db.execute('SELECT * FROM downloads')}
    return {'downloads': sum(downloads.values()), 'platforms': downloads,
            'started': int(db.execute("SELECT value FROM meta WHERE key = 'started'").fetchone()[0]),
            'ratingCount': ratings['count'], 'average': round(ratings['average'], 2) if ratings['count'] else None}


def backup_loop():
    while True:
        try:
            directory = DATA / 'backups'
            directory.mkdir(mode=0o700, exist_ok=True)
            target = directory / (time.strftime('%Y-%m-%d', time.gmtime()) + '.sqlite3')
            if not target.exists():
                temporary = target.with_suffix('.tmp')
                with database() as db, contextlib.closing(sqlite3.connect(temporary)) as out:
                    db.backup(out)
                os.chmod(temporary, 0o600)
                temporary.replace(target)
                for old in sorted(directory.glob('*.sqlite3'))[:-7]:
                    old.unlink()
            plus_directory = directory / 'plus'
            plus_directory.mkdir(mode=0o700, exist_ok=True)
            plus_target = plus_directory / (time.strftime('%Y-%m-%d', time.gmtime()) + '.sqlite3')
            if not plus_target.exists():
                temporary = plus_target.with_suffix('.tmp')
                with PLUS.db() as source, contextlib.closing(sqlite3.connect(temporary)) as out:
                    source.backup(out)
                os.chmod(temporary, 0o600)
                temporary.replace(plus_target)
                for old in sorted(plus_directory.glob('*.sqlite3'))[:-7]:
                    old.unlink()
        except Exception:
            print('Community backup unavailable', flush=True)
        time.sleep(3600)


class Handler(BaseHTTPRequestHandler):
    def end_headers(self):
        if self.path.startswith(('/api/plus/', '/api/sports/')):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Vary', 'Origin')
        super().end_headers()

    def do_OPTIONS(self):
        if not PLUS.handle(self, urlsplit(self.path).path):
            self.send_json(405, {'error': 'method_not_allowed'})

    server_version = 'MorphCommunity'

    def log_message(self, *_):
        # Never put IPs, comment text, passwords or cookies in the application log.
        pass

    def cookie(self, name):
        try:
            jar = http.cookies.SimpleCookie(self.headers.get('Cookie', ''))
            return jar[name].value if name in jar else ''
        except http.cookies.CookieError:
            return ''

    def visitor(self):
        token = self.cookie('morph_visitor')
        parts = token.split('.')
        if len(parts) == 2 and re.fullmatch('[a-f0-9]{32}', parts[0]) and hmac.compare_digest(parts[1], digest('visitor:' + parts[0])):
            return parts[0]
        uid = secrets.token_hex(16)
        self.new_visitor = uid + '.' + digest('visitor:' + uid)
        return uid

    def csrf(self, uid):
        issued = str(int(time.time()))
        return issued + '.' + digest('csrf:' + uid + ':' + issued)

    def valid_csrf(self, uid, token):
        parts = str(token).split('.')
        if len(parts) != 2 or not parts[0].isdigit():
            return False
        age = time.time() - int(parts[0])
        return 2 <= age <= 7200 and hmac.compare_digest(parts[1], digest('csrf:' + uid + ':' + parts[0]))

    def send_json(self, status, body, cookie=None):
        data = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Vary', 'Cookie')
        if getattr(self, 'new_visitor', None):
            self.send_header('Set-Cookie', self.cookie_value('morph_visitor', self.new_visitor, 31536000))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def cookie_value(self, name, value, seconds, admin=False):
        return f'{name}={value}; Path=/; Max-Age={seconds}; HttpOnly; SameSite={"Strict" if admin else "Lax"}' + ('; Secure' if SECURE else '')

    def client_key(self):
        # Nginx overwrites this header after resolving the trusted ingress proxy.
        address = self.headers.get('X-Client-IP', self.client_address[0])
        return digest('client:' + address)

    def admin(self):
        token = self.cookie('morph_admin')
        if not re.fullmatch('[a-f0-9]{64}', token):
            return None
        with database() as db:
            row = db.execute('SELECT expires FROM admin_sessions WHERE token = ?', (digest('admin:' + token),)).fetchone()
        return token if row and row['expires'] > time.time() else None

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        try:
            if SPORTS.handle(self, urlsplit(self.path).path):
                return
            if PLUS.handle(self, urlsplit(self.path).path):
                return
            self.get()
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            self.send_json(503, {'error': 'temporarily_unavailable'})

    def get(self):
        path = urlsplit(self.path).path
        if path.startswith('/download/') or re.fullmatch(r'/Morph-TV-[A-Za-z0-9.\-]+\.(apk|ipk)', path):
            return self.download(path)
        if path == '/api/community/health':
            with database() as db:
                db.execute('SELECT 1').fetchone()
            return self.send_json(200, {'ok': True})
        if path == '/api/community':
            uid = self.visitor()
            query = parse_qs(urlsplit(self.path).query)
            try:
                before = max(0, int(query.get('before', ['0'])[0]))
            except ValueError:
                return self.send_json(400, {'error': 'invalid_cursor'})
            with database() as db:
                stats = summary(db)
                rows = db.execute('SELECT id, name, rating, comment, updated FROM reviews WHERE state = ? AND rating_visible = 1 AND (? = 0 OR id < ?) ORDER BY id DESC LIMIT 21',
                                  ('approved', before, before)).fetchall()
                mine = db.execute('SELECT rating, name, comment, state FROM reviews WHERE visitor = ?', (digest('review:' + uid),)).fetchone()
            return self.send_json(200, {'stats': stats, 'comments': [dict(row) for row in rows[:20]],
                                       'next': rows[19]['id'] if len(rows) > 20 else None,
                                       'csrf': self.csrf(uid), 'mine': dict(mine) if mine else None})
        if path == '/api/admin/reviews':
            token = self.admin()
            if not token:
                return self.send_json(401, {'error': 'authentication_required'})
            query = parse_qs(urlsplit(self.path).query)
            state = query.get('state', ['pending'])[0]
            if state not in ['pending', 'approved', 'rejected', 'all']:
                return self.send_json(400, {'error': 'invalid_filter'})
            try:
                before = max(0, int(query.get('before', ['0'])[0]))
            except ValueError:
                return self.send_json(400, {'error': 'invalid_cursor'})
            with database() as db:
                rows = db.execute('SELECT id, name, rating, comment, state, rating_visible, created, updated FROM reviews WHERE (? = ? OR state = ?) AND (? = 0 OR id < ?) ORDER BY id DESC LIMIT 51',
                                  (state, 'all', state, before, before)).fetchall()
                stats = summary(db)
                pending = db.execute("SELECT COUNT(*) FROM reviews WHERE state = 'pending'").fetchone()[0]
            return self.send_json(200, {'reviews': [dict(row) for row in rows[:50]], 'stats': stats,
                                       'pending': pending, 'next': rows[49]['id'] if len(rows) > 50 else None,
                                       'csrf': digest('admin-csrf:' + token)})
        if path == '/api/admin/plus':
            token = self.admin()
            if not token:
                return self.send_json(401, {'error': 'authentication_required'})
            result = PLUS.grants()
            result['csrf'] = digest('admin-csrf:' + token)
            return self.send_json(200, result)
        return self.send_json(404, {'error': 'not_found'})

    def download(self, path):
        catalog = json.loads((ROOT / 'catalog.json').read_text(encoding='utf-8'))
        route = path.removeprefix('/download/') if path.startswith('/download/') else ''
        platform = {'phone': 'Phone', 'android': 'Android-TV', 'firetv': 'Android-TV', 'lg': 'LG', 'lg-preview': 'LG', 'legacy': 'Legacy'}.get(route)
        entry = next((row for row in catalog['releases'] if (platform and row['name'].startswith('Morph-TV-' + platform + '-')) or ('/' + row['file'] == path)), None)
        if not entry or not re.fullmatch(r'Morph-TV-[A-Za-z0-9.\-]+\.(apk|ipk)', entry['file']):
            return self.send_json(404, {'error': 'not_found'})
        artifact = ROOT / entry['file']
        if not artifact.is_file() or artifact.stat().st_size != entry['bytes']:
            return self.send_json(404, {'error': 'not_found'})
        if self.command == 'GET' and not re.search('bot|crawler|spider|preview|headless|curl|wget|python', self.headers.get('User-Agent', ''), re.I):
            # Count accepted file requests, not installations or completed transfers.
            # Range requests and fast re-downloads share the same ten-minute window.
            key = digest('download:' + self.client_key() + ':' + self.headers.get('User-Agent', '')[:300] + ':' + entry['file'])
            now = int(time.time())
            try:
                with database() as db:
                    db.execute('BEGIN IMMEDIATE')
                    db.execute('DELETE FROM download_seen WHERE seen_at < ?', (now - 86400,))
                    previous = db.execute('SELECT seen_at FROM download_seen WHERE key = ?', (key,)).fetchone()
                    if not previous or previous['seen_at'] < now - 600:
                        label = route or ('lg-preview' if entry['file'].endswith('.ipk') else 'phone' if '-Phone-' in entry['file'] else 'android')
                        db.execute('INSERT INTO downloads VALUES (?, 1) ON CONFLICT(platform) DO UPDATE SET total = total + 1', (label,))
                        db.execute('INSERT OR REPLACE INTO download_seen VALUES (?, ?)', (key, now))
            except sqlite3.Error:
                print('Download counter unavailable; file delivery preserved', flush=True)
        self.send_response(200)
        self.send_header('X-Accel-Redirect', '/_artifacts/' + entry['file'])
        self.send_header('Content-Type', 'application/vnd.android.package-archive' if entry['file'].endswith('.apk') else 'application/octet-stream')
        self.send_header('Content-Disposition', 'attachment; filename="' + entry['file'] + '"')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_POST(self):
        try:
            if SPORTS.handle(self, urlsplit(self.path).path):
                return
            if PLUS.handle(self, urlsplit(self.path).path):
                return
            self.post()
        except (BrokenPipeError, ConnectionResetError):
            pass
        except (ValueError, UnicodeError, json.JSONDecodeError):
            self.send_json(400, {'error': 'invalid_request'})
        except Exception:
            self.send_json(503, {'error': 'temporarily_unavailable'})

    def post(self):
        if self.headers.get('Origin', '') != ORIGIN:
            return self.send_json(403, {'error': 'origin_rejected'})
        if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            return self.send_json(415, {'error': 'json_required'})
        length = int(self.headers.get('Content-Length', '0'))
        if not 0 < length <= 8192:
            return self.send_json(413, {'error': 'request_too_large'})
        data = json.loads(self.rfile.read(length))
        if not isinstance(data, dict):
            return self.send_json(400, {'error': 'invalid_request'})
        path = urlsplit(self.path).path
        if path == '/api/admin/plus':
            token = self.admin()
            if not token or not hmac.compare_digest(str(data.get('csrf', '')), digest('admin-csrf:' + token)):
                return self.send_json(403, {'error': 'authentication_required'})
            if limited('plus-admin:' + self.client_key(), 120, 600):
                return self.send_json(429, {'error': 'too_many_requests'})
            try:
                return self.send_json(200, PLUS.grant_action(data, digest('grant-actor:' + token)))
            except ValueError as error:
                return self.send_json(400, {'error': str(error)})
        if path == '/api/community/review':
            uid = self.visitor()
            if not self.valid_csrf(uid, data.get('csrf', '')):
                return self.send_json(403, {'error': 'refresh_and_wait'})
            if data.get('website'):
                return self.send_json(400, {'error': 'invalid_request'})
            if limited('review:' + self.client_key(), 10, 3600):
                return self.send_json(429, {'error': 'too_many_requests'})
            rating = data.get('rating')
            name, comment = data.get('name', ''), data.get('comment', '')
            if type(rating) is not int or not 1 <= rating <= 5 or not isinstance(name, str) or not isinstance(comment, str):
                return self.send_json(400, {'error': 'invalid_review'})
            name, comment = name.strip(), comment.strip()
            if len(name) > 50 or len(comment) > 1500 or (comment and len(comment) < 3) or any(ord(c) < 32 and c not in '\n\t' for c in name + comment):
                return self.send_json(400, {'error': 'invalid_review'})
            now, state = int(time.time()), 'pending' if comment else 'none'
            with database() as db:
                db.execute('INSERT INTO reviews (visitor, name, rating, comment, state, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(visitor) DO UPDATE SET name = excluded.name, rating = excluded.rating, comment = excluded.comment, state = excluded.state, updated = excluded.updated, approved = NULL',
                           (digest('review:' + uid), name or 'Visitor', rating, comment, state, now, now))
                stats = summary(db)
                visible = bool(db.execute('SELECT rating_visible FROM reviews WHERE visitor = ?', (digest('review:' + uid),)).fetchone()[0])
            return self.send_json(200, {'ok': True, 'commentState': state, 'ratingVisible': visible, 'stats': stats})
        if path == '/api/admin/login':
            if limited('login:' + self.client_key(), 8, 900):
                return self.send_json(429, {'error': 'too_many_requests'})
            encoded = os.environ.get('MORPH_ADMIN_PASSWORD_HASH', '')
            if not encoded:
                return self.send_json(503, {'error': 'admin_not_configured'})
            parts = encoded.split('$')
            password = data.get('password', '')
            if len(parts) != 4 or parts[0] != 'pbkdf2_sha256' or not isinstance(password, str) or not 1 <= len(password) <= 300:
                return self.send_json(401, {'error': 'login_failed'})
            result = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(parts[2]), int(parts[1])).hex()
            if not hmac.compare_digest(result, parts[3]):
                return self.send_json(401, {'error': 'login_failed'})
            token = secrets.token_hex(32)
            with database() as db:
                db.execute('DELETE FROM admin_sessions WHERE expires < ?', (int(time.time()),))
                db.execute('INSERT INTO admin_sessions VALUES (?, ?)', (digest('admin:' + token), int(time.time()) + 28800))
            return self.send_json(200, {'ok': True}, self.cookie_value('morph_admin', token, 28800, True))
        if path in ['/api/admin/moderate', '/api/admin/logout']:
            token = self.admin()
            if not token or not hmac.compare_digest(str(data.get('csrf', '')), digest('admin-csrf:' + token)):
                return self.send_json(403, {'error': 'authentication_required'})
            with database() as db:
                if path.endswith('/logout'):
                    db.execute('DELETE FROM admin_sessions WHERE token = ?', (digest('admin:' + token),))
                    return self.send_json(200, {'ok': True}, self.cookie_value('morph_admin', '', 0, True))
                action, review_id = data.get('action'), data.get('id')
                if action not in ['approve', 'reject', 'spam', 'restore_rating'] or type(review_id) is not int:
                    return self.send_json(400, {'error': 'invalid_action'})
                row = db.execute('SELECT comment FROM reviews WHERE id = ?', (review_id,)).fetchone()
                if not row:
                    return self.send_json(404, {'error': 'not_found'})
                if action == 'approve' and row['comment']:
                    db.execute("UPDATE reviews SET state = 'approved', approved = ? WHERE id = ?", (int(time.time()), review_id))
                elif action == 'reject':
                    db.execute("UPDATE reviews SET state = 'rejected' WHERE id = ?", (review_id,))
                elif action == 'spam':
                    db.execute("UPDATE reviews SET state = 'rejected', rating_visible = 0 WHERE id = ?", (review_id,))
                elif action == 'restore_rating':
                    db.execute('UPDATE reviews SET rating_visible = 1 WHERE id = ?', (review_id,))
                db.execute('INSERT INTO moderation (review_id, action, created) VALUES (?, ?, ?)', (review_id, action, int(time.time())))
            return self.send_json(200, {'ok': True})
        return self.send_json(404, {'error': 'not_found'})


if __name__ == '__main__':
    threading.Thread(target=backup_loop, daemon=True).start()
    server = ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('MORPH_API_PORT', '8081'))), Handler)
    server.daemon_threads = True
    print('Morph community API ready', flush=True)
    server.serve_forever()
