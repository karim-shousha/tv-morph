"""Keep upstream landing changes and reapply this task's narrow desktop additions."""
from pathlib import Path
import subprocess
HERE=Path(__file__).resolve().parent
checkout=HERE.parent/'.tools/desktop-landing'
for name in ['.dockerignore','Dockerfile','index.html']:
    content=subprocess.check_output(['git','show','origin/main:'+name],cwd=checkout)
    (checkout/name).write_bytes(content)
subprocess.run(['python',str(HERE/'stage-landing.py')],check=True)
