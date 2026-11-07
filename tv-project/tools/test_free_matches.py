import concurrent.futures
import datetime as dt
import importlib.util
import tempfile
import threading
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('matches_free', ROOT / 'distribution/community/matches_free.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FreeMatchesTest(unittest.TestCase):
    def event(self):
        return {'idEvent': '123', 'strTimestamp': '2026-11-02T18:00:00', 'strTime': '18:00:00',
                'strHomeTeam': '<script>team</script>', 'strAwayTeam': 'Other', 'strStatus': 'NS',
                'intHomeScore': None, 'intAwayScore': None,
                'strHomeTeamBadge': 'https://evil.example/badge.png'}

    def test_utc_unknown_score_and_badge_origin(self):
        value = module.normalize(self.event())
        self.assertEqual(value['kickoff'], '2026-11-02T18:00:00+00:00')
        self.assertEqual(value['score'], {'home': None, 'away': None})
        self.assertEqual(value['home']['badge'], '')
        self.assertEqual(value['status'], 'scheduled')
        event = self.event()
        event.update(strStatus='FT', intHomeScore='0', intAwayScore='1')
        self.assertEqual(module.normalize(event)['score']['home'], 0)
        self.assertEqual(module.normalize(event)['status'], 'finished')

    def test_shared_cache_collapses_navigation_and_concurrent_clients(self):
        with tempfile.TemporaryDirectory() as folder:
            calls = []
            gate = threading.Event()
            def fetch(endpoint, team):
                calls.append((endpoint, team))
                gate.wait(2)
                return [self.event()]
            clock = lambda: dt.datetime(2026, 11, 2, tzinfo=dt.timezone.utc).timestamp()
            service = module.FreeMatches(folder, fetch=fetch, clock=clock)
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                replies = list(pool.map(lambda _: service.snapshot(), range(20)))
            self.assertTrue(all(r['loading'] for r in replies))
            gate.set()
            for _ in range(100):
                if not service.loading:
                    break
                time.sleep(.01)
            self.assertFalse(service.loading)
            self.assertEqual(len(calls), len(module.TEAMS) * 2)
            self.assertEqual(len(service.snapshot()['matches']), 1)
            service.snapshot()
            self.assertEqual(len(calls), 12)
            restored = module.FreeMatches(folder, fetch=lambda *_: self.fail('Fresh disk cache must be used'), clock=clock)
            self.assertEqual(len(restored.snapshot()['matches']), 1)


if __name__ == '__main__':
    unittest.main()
