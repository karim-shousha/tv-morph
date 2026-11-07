from pathlib import Path
import subprocess,os,signal,json,time,sys
out=Path('test-output');out.mkdir(exist_ok=True);results=[]
for name in ['local-media-response','updater','shared-ui-layout','prayer','settings-readable','matches','desktop','cleaner','review-parity','home-visibility','theme-art-position']:
 print('START',name,flush=True);started=time.monotonic();log=out/('ci-'+name+'.log')
 with log.open('wb') as f:
  p=subprocess.Popen(['node','tests/'+name+'.cjs'],stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
  try:code=p.wait(timeout=180)
  except subprocess.TimeoutExpired:
   os.killpg(p.pid,signal.SIGKILL);p.wait();code=124
 text=log.read_text(errors='replace');print(text[-12000:],flush=True);result={'test':name,'exitCode':code,'seconds':round(time.monotonic()-started,2)};results.append(result);(out/'ci-results.json').write_text(json.dumps(results,indent=2));print('END',result,flush=True)
 if code:sys.exit(code)
