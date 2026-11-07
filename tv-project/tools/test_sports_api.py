"""Isolated contract tests. Synthetic provider records exist only in tests."""
import concurrent.futures, datetime as dt, importlib.util, json, os, sqlite3, tempfile, time, unittest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'distribution/community'))
from sports import Sports, SportsError
class Tests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.calls=0;self.now=time.time();self.service=Sports(Path(self.temp.name),self.fetch,lambda:self.now);self.service.enabled=True
 def tearDown(self):self.temp.cleanup()
 def fetch(self,path,params):
  self.calls+=1
  if path=='leagues':return [{'league':{'id':777,'name':'Premier League','logo':'https://media.api-sports.io/test.png'},'country':{'name':'Egypt'},'seasons':[{'year':2026,'current':True,'coverage':{'fixtures':{'events':True},'standings':True}}]}]
  if path=='teams':return [{'team':{'id':1,'name':'TEST Team','logo':'https://media.api-sports.io/test.png'}}]
  return []
 def test_discovery_and_teams(self):
  result=self.service.query('competitions',{});self.assertEqual(result['data'][0]['id'],777)
  result=self.service.query('teams',{'league':['777'],'season':['2026']});self.assertIsNone(result['data'][0]['logo'])
  with self.assertRaises(SportsError):self.service.query('teams',{'league':['778'],'season':['2026']})
 def test_competition_logo_permission(self):
  self.assertIsNone(self.service.query('competitions',{})['data'][0]['logo'])
  self.service.logos=True
  self.assertEqual(self.service.query('competitions',{})['data'][0]['logo'],'https://media.api-sports.io/test.png')
 def test_concurrent_cache_and_restart(self):
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(lambda _:self.service.query('competitions',{}),range(16)))
  self.assertEqual(self.calls,1);other=Sports(Path(self.temp.name),self.fetch,lambda:self.now);other.enabled=True;other.query('competitions',{});self.assertEqual(self.calls,1)
 def test_stale_failure_and_cooldown(self):
  self.service.query('competitions',{});self.now+=86401
  def fail(*args):raise SportsError('rate_limited',429)
  self.service.fetcher=fail;self.assertTrue(self.service.query('competitions',{})['stale'])
  self.assertTrue(self.service.query('competitions',{})['stale'])
  with self.assertRaises(SportsError) as e:self.service.query('fixtures',{'date':[dt.datetime.fromtimestamp(self.now,dt.timezone.utc).date().isoformat()]})
  self.assertEqual(e.exception.status,429)
 def test_budget_and_invalid_date(self):
  self.service.budget=1;self.service.query('competitions',{})
  with self.assertRaises(SportsError) as e:self.service.query('fixtures',{'date':[dt.date.today().isoformat()]})
  self.assertEqual(e.exception.status,429)
  with self.assertRaises(SportsError) as e:self.service.query('fixtures',{'date':['2099-01-01']})
  self.assertEqual(e.exception.status,400)
 def test_configuration(self):
  self.service.enabled=False
  with self.assertRaises(SportsError) as e:self.service.query('competitions',{})
  self.assertEqual(e.exception.code,'configuration_required')
if __name__=='__main__':unittest.main()
