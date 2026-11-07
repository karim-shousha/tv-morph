import datetime,json,urllib.request,urllib.error
base='https://morphtv.herroshetta.com'
for path in ['/api/matches','/api/community/health','/api/sports/health','/api/sports/fixtures?date='+datetime.date.today().isoformat(),'/api/sports/leagues']:
    try:
        with urllib.request.urlopen(base+path,timeout=20) as r:
            data=json.load(r)
            print(path,r.status,json.dumps(data,ensure_ascii=True)[:1000])
    except urllib.error.HTTPError as e:print(path,e.code,e.read()[:300])
    except Exception as e:print(path,type(e).__name__)
