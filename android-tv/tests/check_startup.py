from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[2];src=root/'android-tv/src/local/tvmorph/tv';jdk=root/'.tools/tizen/sdk/data/jdk/bin'
deps=[root/'.tools/test-libs/json.jar',root/'.tools/provider196']
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-3000:])
 return p.stdout.strip()
results=[]
for name,source in [('baseline',root/'.tools/player252-backup/Xtream.java'),('updated',src/'Xtream.java')]:
 build=root/'.tools/player252-startup'/name;build.mkdir(parents=True,exist_ok=True)
 cp=';'.join(str(p) for p in deps)
 print(run([jdk/'javac.exe','-encoding','UTF-8','-classpath',cp,'-d',build,source,src/'ProviderPlayback.java',src/'XtreamCredentials.java',src/'ProviderHttp.java',src/'ReleaseYear.java',Path(__file__).parent/'startup-stubs/PortalSource.java',Path(__file__).parent/'startup-stubs/ProviderCatalog.java',Path(__file__).parent/'XtreamStartupCheck.java',Path(__file__).parent/'XtreamMetadataCheck.java']))
 cp=';'.join(str(p) for p in [build,*deps])
 result=run([jdk/'java.exe','-cp',cp,'local.tvmorph.tv.XtreamStartupCheck',name]);print(result);results.append(result)
 if name=='updated':result=run([jdk/'java.exe','-cp',cp,'local.tvmorph.tv.XtreamMetadataCheck']);print(result);results.append(result)
(root/'.tools/player252-startup/results.txt').write_text('\n'.join(results),encoding='utf-8')
