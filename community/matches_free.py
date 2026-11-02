"""Small, shared schedule cache. Public TheSportsDB v1 only; no paid API.

The free feed is a selection, not a complete fixture list or a live-score feed.
No upstream artwork is redistributed. All TV clients share one hourly refresh.
"""
import datetime as dt
import json
import os
from pathlib import Path
import threading
import time
import urllib.request
from urllib.parse import urlsplit

TEAMS = (
    ('138995', 'Al Ahly', 'الأهلي'), ('138997', 'Zamalek', 'الزمالك'),
    ('133738', 'Real Madrid', 'ريال مدريد'), ('133739', 'Barcelona', 'برشلونة'),
    ('133602', 'Liverpool', 'ليفربول'), ('133604', 'Arsenal', 'أرسنال'),
)
TTL = 3600


def normalize(event):
    """Keep UTC and unknown scores intact; never manufacture a result/live state."""
    if not isinstance(event, dict) or not str(event.get('idEvent', '')).isdigit():
        return None
    stamp = event.get('strTimestamp')
    if not stamp and event.get('dateEvent'):
        stamp = event['dateEvent'] + 'T' + (event.get('strTime') or '00:00:00')
    try:
        kickoff = dt.datetime.fromisoformat(stamp.replace('Z', '+00:00'))
        if kickoff.tzinfo is None:
            kickoff = kickoff.replace(tzinfo=dt.timezone.utc)
    except (TypeError, ValueError, AttributeError):
        return None
    def score(key):
        value = event.get(key)
        try:
            number = int(value)
            return number if 0 <= number <= 99 else None
        except (TypeError, ValueError):
            return None
    status = str(event.get('strStatus') or '').upper()
    state = 'finished' if status in ('FT', 'AET', 'PEN', 'MATCHFINISHED') else 'scheduled'
    if status in ('PST', 'CANC', 'ABD', 'POSTPONED', 'CANCELLED'):
        state = 'postponed'
    def badge(key):
        value = str(event.get(key) or '')
        url = urlsplit(value)
        return value if (url.scheme == 'https' and url.netloc in ('r2.thesportsdb.com', 'www.thesportsdb.com')
                         and url.path.startswith('/images/media/team/badge/') and len(value) < 350) else ''
    return {
        'id': str(event['idEvent']), 'kickoff': kickoff.isoformat(),
        'timeKnown': bool(event.get('strTime')), 'status': state,
        'competition': str(event.get('strLeague') or '')[:100],
        'home': {'id': str(event.get('idHomeTeam') or ''), 'name': str(event.get('strHomeTeam') or '')[:90], 'badge': badge('strHomeTeamBadge')},
        'away': {'id': str(event.get('idAwayTeam') or ''), 'name': str(event.get('strAwayTeam') or '')[:90], 'badge': badge('strAwayTeamBadge')},
        'score': {'home': score('intHomeScore'), 'away': score('intAwayScore')},
    }


class FreeMatches:
    def __init__(self, data_dir, fetch=None, clock=time.time):
        self.path = Path(data_dir) / 'matches-free-cache.json'
        self.clock = clock
        self.fetch = fetch or self._fetch
        self.lock = threading.Lock()
        self.loading = False
        self.retry_at = 0
        self.cache = {'matches': [], 'updatedAt': 0}
        try:
            data = json.loads(self.path.read_text('utf-8'))
            if isinstance(data.get('matches'), list) and len(data['matches']) <= 32:
                self.cache = data
        except (OSError, ValueError, TypeError):
            pass

    def _fetch(self, endpoint, team):
        url = 'https://www.thesportsdb.com/api/v1/json/123/' + endpoint + '?id=' + team
        request = urllib.request.Request(url, headers={'User-Agent': 'MorphLauncher-Matches/1.0'})
        with urllib.request.urlopen(request, timeout=6) as response:
            raw = response.read(512 * 1024 + 1)
            if len(raw) > 512 * 1024:
                raise ValueError('feed_too_large')
            body = json.loads(raw)
        if not isinstance(body, dict) or not any(k in body for k in ('events', 'results')):
            raise ValueError('invalid_feed')
        return body.get('events') or body.get('results') or []

    def refresh(self):
        try:
            items = {}
            successes = 0
            for team, _, _ in TEAMS:
                for endpoint in ('eventsnext.php', 'eventslast.php'):
                    try:
                        events = self.fetch(endpoint, team)
                        if not isinstance(events, list):
                            raise ValueError('invalid_feed')
                        successes += 1
                        for raw in events[:10]:
                            item = normalize(raw)
                            if item:
                                items[item['id']] = item
                    except Exception:
                        continue
            if successes:
                # Preserve cached entries on a partial outage; age them out below.
                if successes < len(TEAMS) * 2:
                    for item in self.cache['matches']:
                        items.setdefault(item['id'], item)
                oldest = self.clock() - 35 * 86400
                values = [m for m in items.values() if dt.datetime.fromisoformat(m['kickoff']).timestamp() >= oldest]
                data = {'matches': sorted(values, key=lambda m: m['kickoff'])[:32],
                        'updatedAt': self.clock(), 'partial': successes < len(TEAMS) * 2}
                self.path.parent.mkdir(parents=True, exist_ok=True)
                temp = self.path.with_suffix('.tmp')
                temp.write_text(json.dumps(data, ensure_ascii=False), 'utf-8')
                os.replace(temp, self.path)
                with self.lock:
                    self.cache = data
            else:
                self.retry_at = self.clock() + 300
        finally:
            with self.lock:
                self.loading = False

    def snapshot(self):
        with self.lock:
            stale = self.clock() - self.cache['updatedAt'] >= TTL
            if stale and not self.loading and self.clock() >= self.retry_at:
                self.loading = True
                threading.Thread(target=self.refresh, daemon=True).start()
            data = dict(self.cache)
            badges = {side['id']: side.get('badge', '') for match in data['matches'] for side in (match['home'], match['away']) if side.get('badge')}
            data.update({'stale': stale, 'loading': self.loading, 'refreshAfter': TTL,
                         'source': 'TheSportsDB', 'limitedCoverage': True,
                         'teams': [{'id': i, 'name': en, 'ar': ar, 'badge': badges.get(i, '')} for i, en, ar in TEAMS],
                         'news': []})
            # Seven-day-old data must not masquerade as a current schedule.
            if self.clock() - data['updatedAt'] > 7 * 86400:
                data['matches'] = []
            return data

    def handle(self, handler, path):
        if path != '/api/matches':
            return False
        if handler.command not in ('GET', 'HEAD'):
            handler.send_json(405, {'error': 'method_not_allowed'})
        else:
            handler.send_json(200, self.snapshot())
        return True
