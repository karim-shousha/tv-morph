"""Open the separate reference preview, or return to the preserved current design."""
from pathlib import Path
import os,shutil,subprocess,sys

HERE=Path(__file__).resolve().parent
PC=HERE.parent
ROOT=PC.parent
env=os.environ.copy()
if '--current' in sys.argv:
    env.pop('MORPH_PC_UI_DIR',None)
    env.pop('MORPH_PC_TEST_DATA',None)
else:
    ui=ROOT/'output/gold-reference-preview/ui'
    if not (ui/'index.html').exists():subprocess.run([sys.executable,str(HERE/'build.py')],check=True,cwd=ROOT)
    profile=ROOT/'.private/gold-reference-preview-profile'
    if not profile.exists():
        source=Path(os.environ['APPDATA'])/'Morph Launcher'
        if source.exists():
            shutil.copytree(source,profile,ignore=shutil.ignore_patterns('Cache','Code Cache','GPUCache','DawnGraphiteCache','DawnWebGPUCache','GrShaderCache','ShaderCache','Crashpad','lockfile','LOCK','DevToolsActivePort','*.log'))
        else:profile.mkdir(parents=True)
    env['MORPH_PC_UI_DIR']=str(ui)
    env['MORPH_PC_TEST_DATA']=str(profile)
exe=PC/'node_modules/electron/dist/electron.exe'
subprocess.Popen([str(exe),str(PC),'--remote-debugging-address=127.0.0.1','--remote-debugging-port=9338'],cwd=PC,env=env)
print('Opened current launcher.' if '--current' in sys.argv else 'Opened isolated gold reference preview. Original profile and current UI are preserved.')
