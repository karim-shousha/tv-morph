"""API-Football adapter for the existing Morph API process. No client credentials."""
import contextlib
import datetime as dt
import json
import os
import re
import sqlite3
import threading
import time
from urllib.parse import urlencode, urlsplit, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError

LIVE = {'1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'}
PRIORITY = ['Premier League', 'Pro League', 'CAF Champions League', 'AFC Champions League Elite', 'UEFA Champions League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'World Cup', 'Africa Cup of Nations', 'Asian Cup', 'Euro Championship', 'Copa America']

class SportsError(Exception):
    def __init__(self, code, status=503):
        self.code, self.status = code, status

class Sports:
    def __init__(self, data, fetcher=None, clock=time.time):
        self.path = str(data / 'sports.sqlite3')
        self.lock = threading.RLock()
        self.clock = clock
        self.fetcher = fetcher or self.fetch
        self.key = os.environ.get('MORPH_SPORTS_API_KEY', '')
        self.enabled = bool(self.key) and os.environ.get('MORPH_SPORTS_DATA_APPROVED') == '1'
        self.logos = os.environ.get('MORPH_SPORTS_LOGOS_APPROVED') == '1'
        try:
            self.budget = max(1, int(os.environ.get('MORPH_SPORTS_DAILY_BUDGET', '90')))
        except ValueError:
            self.budget = 90
        with self.db() as db:
            db.execute('CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, body TEXT, expires REAL, saved REAL)')
            db.execute('CREATE TABLE IF NOT EXISTS budget (day TEXT PRIMARY KEY, used INTEGER)')
            db.execute('CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value REAL)')

    @contextlib.contextmanager
    def db(self):
        connection = sqlite3.connect(self.path, timeout=12)
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def fetch(self, path, params):
        req = Request('https://v3.football.api-sports.io/' + path + '?' + urlencode(params), headers={'x-apisports-key': self.key})
        try:
            with urlopen(req, timeout=10) as res:
                data = json.loads(res.read(4_000_001))
        except HTTPError as error:
            raise SportsError('rate_limited' if error.code == 429 else 'provider_unavailable', 429 if error.code == 429 else 503)
        except Exception:
            raise SportsError('provider_unavailable')
        errors = data.get('errors')
        if errors:
            code = 'rate_limited' if any(word in str(errors).lower() for word in ['limit', 'requests', 'quota']) else 'provider_unavailable'
            raise SportsError(code, 429 if code == 'rate_limited' else 503)
        if not isinstance(data.get('response'), list):
            raise SportsError('provider_unavailable')
        return data['response']

    def cached(self, path, params, ttl):
        key = path + '?' + urlencode(sorted(params.items()))
        # One shared process lock collapses simultaneous device misses. SQLite persists across restart.
        with self.lock, self.db() as db:
            now = self.clock()
            old = db.execute('SELECT body, expires, saved FROM cache WHERE key=?', (key,)).fetchone()
            if old and old[1] > now:
                return json.loads(old[0]), old[2], False
            try:
                block = db.execute("SELECT value FROM state WHERE key='cooldown'").fetchone()
                if block and block[0] > now:
                    raise SportsError('rate_limited', 429)
                day = dt.datetime.fromtimestamp(now, dt.timezone.utc).date().isoformat()
                db.execute('DELETE FROM budget WHERE day<>?', (day,))
                db.execute('INSERT OR IGNORE INTO budget VALUES (?,0)', (day,))
                if db.execute('SELECT used FROM budget WHERE day=?', (day,)).fetchone()[0] >= self.budget:
                    raise SportsError('rate_limited', 429)
                db.execute('UPDATE budget SET used=used+1 WHERE day=?', (day,))
                db.commit()
                rows = self.fetcher(path, params)
                actual_ttl = ttl(rows) if callable(ttl) else ttl
                db.execute('INSERT OR REPLACE INTO cache VALUES (?,?,?,?)', (key, json.dumps(rows), now + actual_ttl, now))
                db.execute('DELETE FROM cache WHERE saved<?', (now - 7 * 86400,))
                return rows, now, False
            except SportsError as error:
                if error.code == 'rate_limited':
                    db.execute("INSERT OR REPLACE INTO state VALUES ('cooldown',?)", (now + 900,))
                if old and now - old[2] < 7 * 86400:
                    return json.loads(old[0]), old[2], True
                db.commit()
                raise

    def logo(self, value):
        return value if self.logos and isinstance(value, str) and value.startswith('https://media.api-sports.io/') else None

    def team(self, row):
        return {'id': row.get('id'), 'name': row.get('name') or '—', 'logo': self.logo(row.get('logo'))}

    def fixture(self, row):
        f, league, teams = row['fixture'], row['league'], row['teams']
        return {'id': f['id'], 'kickoff': f.get('date'), 'status': f.get('status', {}).get('short', 'TBD'), 'minute': f.get('status', {}).get('elapsed'), 'venue': (f.get('venue') or {}).get('name'), 'competition': {'id': league['id'], 'name': league['name'], 'logo': self.logo(league.get('logo')), 'season': league['season']}, 'home': self.team(teams['home']), 'away': self.team(teams['away']), 'score': row.get('goals', {}), 'halftime': (row.get('score') or {}).get('halftime'), 'events': row.get('events') or [], 'lineups': row.get('lineups') or [], 'statistics': row.get('statistics') or []}

    def fixture_ttl(self, rows):
        if any(r.get('status') in LIVE for r in rows):
            return 90
        for row in rows:
            if row.get('status') in ['NS', 'TBD']:
                try:
                    start = dt.datetime.fromisoformat(row['kickoff'].replace('Z', '+00:00')).timestamp()
                    if abs(start - self.clock()) <= 7200:
                        return 90
                except (ValueError, TypeError, KeyError):
                    pass
        return 3600 if any(r.get('status') in ['NS', 'TBD'] for r in rows) else 21600

    def query(self, route, q):
        if not self.enabled:
            raise SportsError('configuration_required')
        def number(name):
            value = q.get(name, [''])[0]
            if not re.fullmatch(r'[1-9][0-9]{0,8}', value):
                raise SportsError('invalid_request', 400)
            return int(value)
        if route == 'competitions':
            rows, saved, stale = self.cached('leagues', {'current': 'true'}, 86400)
            data = []
            for row in rows:
                seasons = [s for s in row.get('seasons', []) if s.get('current') and (s.get('coverage') or {}).get('fixtures')]
                if not seasons:
                    continue
                league = row['league']; season = seasons[-1]; country = row.get('country', {}).get('name', '')
                data.append({'id': league['id'], 'name': league['name'], 'logo': self.logo(league.get('logo')), 'country': country, 'season': season['year'], 'standings': bool(season['coverage'].get('standings')), 'priority': (league['name'] in PRIORITY and (league['name'] != 'Premier League' or country in ['Egypt', 'England']))})
            data.sort(key=lambda r: (not r['priority'], r['country'], r['name']))
        elif route == 'fixtures':
            date = q.get('date', [''])[0]
            try:
                selected = dt.date.fromisoformat(date)
                today = dt.datetime.fromtimestamp(self.clock(), dt.timezone.utc).date()
                if abs((selected - today).days) > 32: raise ValueError()
            except ValueError:
                raise SportsError('invalid_request', 400)
            # UTC days shared across all TV timezones; UI combines three cached days and filters locally.
            ttl = lambda rows: self.fixture_ttl([self.fixture(r) for r in rows]) if rows else 3600
            rows, saved, stale = self.cached('fixtures', {'date': date}, ttl)
            data = [self.fixture(r) for r in rows]
        elif route == 'match':
            rows, saved, stale = self.cached('fixtures', {'id': number('id')}, lambda rows: self.fixture_ttl([self.fixture(r) for r in rows]))
            data = [self.fixture(r) for r in rows]
        elif route in ['standings', 'teams']:
            league, season = number('league'), number('season')
            competitions = self.query('competitions', {})['data']
            found = next((r for r in competitions if r['id'] == league and r['season'] == season), None)
            if not found or (route == 'standings' and not found['standings']):
                raise SportsError('unsupported', 404)
            rows, saved, stale = self.cached(route, {'league': league, 'season': season}, 21600 if route == 'standings' else 86400)
            if route == 'teams':
                data = [self.team(r['team']) for r in rows]
            else:
                data = []
                for r in rows:
                    for group in r.get('league', {}).get('standings', []):
                        data.append([{'rank': t['rank'], 'team': self.team(t['team']), 'played': t['all']['played'], 'won': t['all']['win'], 'drawn': t['all']['draw'], 'lost': t['all']['lose'], 'difference': t['goalsDiff'], 'points': t['points'], 'group': t.get('group', '')} for t in group])
        else:
            raise SportsError('not_found', 404)
        refresh = 3600
        if route in ['fixtures', 'match']:
            refresh = self.fixture_ttl(data) if data else 3600
        return {'data': data, 'updatedAt': saved, 'stale': stale, 'refreshAfter': 900 if stale else refresh, 'provider': 'API-Football'}

    def handle(self, handler, path):
        if not path.startswith('/api/sports/'):
            return False
        try:
            result = self.query(path.rsplit('/', 1)[-1], parse_qs(urlsplit(handler.path).query))
            handler.send_json(200, result)
        except SportsError as error:
            handler.send_json(error.status, {'error': error.code, 'retryAfter': 900 if error.status == 429 else 90})
        return True
