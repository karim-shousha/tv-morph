"""Ephemeral opaque mailbox for TV setup. Keys and account plaintext never reach this service."""
import base64
import hmac
import json
import re
import secrets
import threading
import time

_lock = threading.Lock()
_sessions = {}
_token = re.compile(r'^[A-Za-z0-9_-]{22,64}$')
_cipher = re.compile(r'^[A-Za-z0-9_-]+$')
MAX_BODY = 2900000
MAX_STORED = 8 * 1024 * 1024

def _prune():
    now = time.monotonic()
    for key in list(_sessions):
        if _sessions[key]['until'] <= now:
            del _sessions[key]

def _janitor():
    while True:
        time.sleep(15)
        with _lock:
            _prune()

threading.Thread(target=_janitor, daemon=True).start()

def _reply(handler, status, data):
    body = json.dumps(data, separators=(',', ':')).encode()
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Cache-Control', 'no-store')
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type')
    handler.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    handler.send_header('X-Content-Type-Options', 'nosniff')
    handler.end_headers()
    if handler.command != 'HEAD':
        handler.wfile.write(body)

def handle(handler, path):
    if path != '/api/iptv-link':
        return False
    if handler.command == 'OPTIONS':
        _reply(handler, 200, {})
        return True
    if handler.command != 'POST':
        _reply(handler, 405, {'error': 'method'})
        return True
    try:
        length = int(handler.headers.get('Content-Length', '0'))
        if not 0 < length <= MAX_BODY or handler.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            raise ValueError()
        handler.connection.settimeout(15)
        request = json.loads(handler.rfile.read(length))
        if not isinstance(request, dict):
            raise ValueError()
        action = request.get('action')
        ip = handler.headers.get('X-Client-IP', handler.client_address[0])
        with _lock:
            _prune()
            if action == 'create':
                if len(_sessions) >= 64 or sum(s['ip'] == ip for s in _sessions.values()) >= 12:
                    _reply(handler, 429, {'error': 'busy'})
                    return True
                method = request.get('method')
                if method not in ['xtream', 'm3u', 'portal', 'file']:
                    raise ValueError()
                key = secrets.token_urlsafe(16)
                read, write = secrets.token_urlsafe(24), secrets.token_urlsafe(16)
                _sessions[key] = dict(read=read, write=write, until=time.monotonic()+300,
                                      ip=ip, method=method, status='waiting', payload=None)
                result = dict(id=key, read=read, write=write, expiresIn=300)
            else:
                key, token = request.get('id', ''), request.get('token', '')
                if not isinstance(key, str) or not isinstance(token, str) or not _token.fullmatch(key) or not _token.fullmatch(token):
                    raise ValueError()
                session = _sessions.get(key)
                secret = session and session['read' if action in ['poll', 'ack', 'cancel'] else 'write']
                if not secret or not hmac.compare_digest(secret, token):
                    _reply(handler, 401, {'error': 'expired'})
                    return True
                if action == 'send':
                    if session['status'] not in ['waiting', 'failed']:
                        _reply(handler, 409, {'error': 'already_sent'})
                        return True
                    nonce, box = request.get('nonce', ''), request.get('box', '')
                    if not isinstance(nonce, str) or not re.fullmatch(r'[A-Za-z0-9_-]{32}', nonce):
                        raise ValueError()
                    if not isinstance(box, str) or not 24 <= len(box) <= 2800000 or not _cipher.fullmatch(box):
                        raise ValueError()
                    if sum(len((s.get('payload') or {}).get('box', '')) for s in _sessions.values()) + len(box) > MAX_STORED:
                        _reply(handler, 429, {'error': 'busy'})
                        return True
                    session.update(payload=dict(nonce=nonce, box=box), status='pending')
                    result = {'status': 'sent'}
                elif action == 'poll':
                    result = {'status': session['status'], 'method': session['method']}
                    if session['status'] == 'pending' or (session['status'] == 'processing' and time.monotonic() >= session.get('lease', 0)):
                        result['payload'] = session['payload']
                        session['status'] = 'processing'
                        session['lease'] = time.monotonic()+12
                elif action == 'status':
                    result = {'status': session['status']}
                elif action == 'ack':
                    requested_status = 'connected' if request.get('connected') is True else 'failed'
                    if session['status'] == requested_status:
                        _reply(handler, 200, {'status': requested_status})
                        return True
                    if session['status'] != 'processing':
                        _reply(handler, 409, {'error': 'state'})
                        return True
                    status = 'connected' if request.get('connected') is True else 'failed'
                    session.update(payload=None, status=status)
                    if status == 'connected':
                        session['until'] = time.monotonic()+30
                    result = {'status': status}
                elif action == 'cancel':
                    del _sessions[key]
                    result = {'status': 'cancelled'}
                else:
                    raise ValueError()
        _reply(handler, 200, result)
    except (ValueError, TypeError, KeyError, json.JSONDecodeError):
        _reply(handler, 400, {'error': 'invalid'})
    return True
