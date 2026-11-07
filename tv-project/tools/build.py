from pathlib import Path
import subprocess,shutil,zipfile
root=Path(__file__).resolve().parents[2]
base=root/'.tools/tizen/sdk/data';ide=base/'tools/ide';stage=root/'.tools/tizen/build/clear-tv-package'
stage.mkdir(parents=True,exist_ok=True)
# Remove generated package/signature files only, within this dedicated build folder.
for old in stage.iterdir():
 if old.is_file(): old.unlink()
for source in (root/'tv-project/app').iterdir():
 if source.is_file() and source.suffix in ('.html','.css','.js','.xml'): shutil.copy2(source,stage/source.name)
 if source.is_dir() and source.name in ['assets','ui','fitness']: shutil.copytree(source,stage/source.name,dirs_exist_ok=True)
shutil.copy2(root/'mobile-app/assets/ui/locale.js',stage/'locale.js')
html=(stage/'index.html').read_text(encoding='utf-8')
html=html.replace('<script defer src="core.js">','<script defer src="locale.js"></script><script defer src="core.js">')
(stage/'index.html').write_text(html,encoding='utf-8')
# Match the existing webOS pipeline's compatibility compilation without dependencies in the TV.
esbuild=root/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe'
for script in stage.rglob('*.js'):
 if script.name in ['moment.min.js','moment-timezone.min.js']:continue
 temp=stage.parent/'sports-compile.js'
 subprocess.run([str(esbuild),str(script),'--target=chrome63','--outfile='+str(temp),'--log-level=error'],check=True)
 script.write_bytes(temp.read_bytes())
cp=';'.join([str(ide/'conf-ncli')]+[str(x) for x in (ide/'lib-ncli').glob('*.jar')])
cmd=[str(base/'jdk/bin/java.exe'),'-Dlog4j.configurationFile='+str(ide/'conf-ncli/log4j-info.xml'),'-cp',cp,'org.tizen.ncli.ide.shell.Main','package','-t','wgt','-s','ClearTV','--',str(stage)]
r=subprocess.run(cmd,cwd=ide/'bin',capture_output=True,text=True)
if r.returncode: print(r.stdout,r.stderr);raise SystemExit(r.returncode)
wgt=stage/'Morph TV.wgt'
with zipfile.ZipFile(wgt) as z:
 assert all(n in z.namelist() for n in ['index.html','app.js','core.js','weather.js','catalog.js','focus.js','inputs.js','assets/al-ahly.png','style.css','config.xml','signature1.xml','author-signature.xml'])
 assert not any(n.endswith(('.p12','.pwd','.wgt')) for n in z.namelist())
 print('Signed package validated:',len(z.namelist()),'files')
shutil.copy2(wgt,root/'tv-project/ClearTV.wgt')
