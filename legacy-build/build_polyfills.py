"""Regenerate the legacy ES5 polyfill bundle from pinned sources (fixes RC-02).

Pipeline: esbuild bundle (iife) -> Babel preset-env ie:'11' -> acorn ecmaVersion:5 gate.
Reads .tools/tizen3-build pinned deps only; writes the output path given.
"""
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / '.tools'
ESBUILD = TOOLS / 'samsung-web' / 'node_modules' / '@esbuild' / 'win32-x64' / 'esbuild.exe'
MODULES = TOOLS / 'tizen3-build' / 'node_modules'
TMP = Path(__file__).resolve().parent / 'tmp-polyfill'
BABEL_SCRIPT = """const babel=require(%(babel)s);const fs=require('fs');
const src=fs.readFileSync(%(inp)s,'utf8');
const out=babel.transformSync(src,{filename:'poly-bundle.js',sourceType:'script',babelrc:false,configFile:false,comments:false,compact:true,presets:[[require.resolve(%(preset)s),{targets:{ie:'11'},modules:false,bugfixes:true,useBuiltIns:false}]]}).code;
fs.writeFileSync(%(out)s,out);console.log('BABEL-OK '+out.length);
"""  # noqa


def run(args):
    p = subprocess.run([str(x) for x in args], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError((p.stdout + p.stderr)[-2500:])
    return p.stdout


def build(entry_js, out_js):
    TMP.mkdir(parents=True, exist_ok=True)
    bundled = TMP / 'poly-bundle.js'
    run([ESBUILD, str(entry_js), '--bundle', '--platform=browser', '--format=iife',
         '--outfile=' + str(bundled)])
    script = (BABEL_SCRIPT % {
        'babel': repr(str(MODULES / '@babel' / 'core')).replace("'", '"'),
        'inp': repr(str(bundled)).replace("'", '"'),
        'out': repr(str(TMP / 'poly-es5.js')).replace("'", '"'),
        'preset': repr(str(MODULES / '@babel' / 'preset-env')).replace("'", '"'),
    })
    helper = TMP / 'babel-run.cjs'
    helper.write_text(script, encoding='utf-8')
    print(run(['node', str(helper)]))
    es5 = TMP / 'poly-es5.js'
    # Gate: must parse as ES5 or the Tizen 2.3 WebKit will die on load (RC-02).
    sys.path.insert(0, str(ROOT / 'legacy-build'))
    from guard import es5_gate
    es5_gate(es5)
    Path(out_js).write_bytes(es5.read_bytes())
    print('POLYFILL-ES5-OK bytes=%d -> %s' % (Path(out_js).stat().st_size, out_js))
    return out_js


if __name__ == '__main__':
    build(Path(sys.argv[1]), Path(sys.argv[2]))
