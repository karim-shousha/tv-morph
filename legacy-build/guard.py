"""Shared build-time compatibility guard for legacy packages (RC-01, RC-10, RC-02).

Usage from a legacy build.py:
    from legacy_build.guard import load_matrix, assert_source_zip, scan_file, es5_gate, assert_html_order, write_validation
No modern production code is touched; this only reads sources and validates outputs.
"""
from pathlib import Path
import json, re, subprocess, sys, zipfile, os

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def load_matrix():
    with open(HERE / 'matrix.json', encoding='utf-8') as f:
        matrix = json.load(f)
    # A review can explicitly derive from a frozen modern artifact without
    # replacing the release snapshot or changing any modern build inputs.
    source = os.environ.get('MORPH_LEGACY_SOURCE')
    if source:
        path = Path(source).resolve()
        if not path.is_file():
            raise RuntimeError('Missing frozen legacy source: '+str(path))
        matrix['source']['tvAppZip'] = str(path)
    return matrix


def _tizen_cli():
    exe = ROOT / '.tools' / 'samsung-web' / 'node_modules' / '@esbuild' / 'win32-x64' / 'esbuild.exe'
    return exe


def node():
    return 'node'


def tizen3_modules():
    return ROOT / '.tools' / 'tizen3-build' / 'node_modules'


def read_zip_config(zip_path):
    """Return (version, app_id, required_version, name) from a tv-app style zip."""
    with zipfile.ZipFile(zip_path) as z:
        raw = z.read('config.xml').decode('utf-8')
    ver = re.search(r'<widget[^>]*\sversion="([^"]+)"', raw)
    app = re.search(r'<tizen:application[^>]*id="([^"]+)"[^>]*required_version="([^"]+)"', raw)
    if not app:
        app = re.search(r'<tizen:application[^>]*required_version="([^"]+)"[^>]*id="([^"]+)"', raw)
        app_id, req = (app.group(2), app.group(1)) if app else (None, None)
    else:
        app_id, req = app.group(1), app.group(2)
    name = re.search(r'<name>([^<]+)</name>', raw)
    return (ver.group(1) if ver else None, app_id, req, name.group(1) if name else None)


def assert_source_zip(zip_path, matrix=None):
    """Refuse to build legacy packages from anything but the approved modern source."""
    matrix = matrix or load_matrix()
    src = matrix['source']
    version, app_id, req, name = read_zip_config(zip_path)
    expect = (src['sourceVersion'], src['sourceAppId'], src['sourceRequiredVersion'])
    if (version, app_id, req) != expect:
        raise RuntimeError(
            'Refusing legacy build: source %s has (%s, %s, %s), expected %s. '
            'Legacy packages must derive from the current stable tv-app.zip only.' % (zip_path, version, app_id, req, expect))
    return version


def scan_forbidden_text(text, tokens):
    """Line-aware scan for syntax tokens that are fatal on a legacy engine."""
    hits = []
    for i, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('*'):
            continue
        for tok in tokens:
            if tok in line:
                hits.append((i, tok, line.strip()[:160]))
                break
    return hits


def scan_file(path, tokens):
    return scan_forbidden_text(Path(path).read_text(encoding='utf-8', errors='replace'), tokens)


def es5_gate(path):
    """Parse a shipped JS file as ES5. Raises with location on failure (RC-02)."""
    script = (
        "const acorn=require(%s);const fs=require('fs');"
        "try{acorn.parse(fs.readFileSync(%s,'utf8'),{ecmaVersion:5});console.log('ES5-OK');}"
        "catch(e){console.error('ES5-FAIL '+e.message);process.exit(1);}"
    ) % (json.dumps(str(tizen3_modules() / 'acorn')), json.dumps(str(path)))
    p = subprocess.run([node(), '-e', script], capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError('ES5 gate failed for %s: %s' % (path, (p.stderr or p.stdout)[-500:]))
    return True


def assert_html_order(html_path):
    """Legacy compat scripts must precede every application script (RC-01 ordering)."""
    s = Path(html_path).read_text(encoding='utf-8', errors='replace')
    heads = [m.start() for m in re.finditer(r'<head[^>]*>', s)]
    body = s[heads[0]:] if heads else s
    compat = [m.start() for m in re.finditer(r'legacy-(polyfills|es5-header|variable-rules|runtime|caps)\.js', body)]
    if len(compat) < 3:
        raise RuntimeError('Missing legacy compat scripts in %s' % html_path)
    first_app = None
    for m in re.finditer(r'<script[^>]*src="([^"]+)"', body):
        src = m.group(1)
        if 'legacy-' not in src:
            first_app = m.start()
            break
    if first_app is not None and max(compat) > first_app:
        raise RuntimeError('Compat scripts load after application scripts in %s' % html_path)
    return True


def inject_compat(html, prefix, order):
    """Prepend legacy scripts (+light stylesheet) before any application script,
    including headless fragment pages (RC-01). Returns (new_html, method)."""
    tags = ''.join('<script src="' + prefix + n + '"></script>' for n in order)
    link = '<link rel="stylesheet" href="' + prefix + 'legacy-light.css">'
    if '<head>' in html:
        return html.replace('<head>', '<head>' + tags, 1).replace(
            '</head>', link + '</head>'), 'head'
    m = re.search(r'<html[^>]*>', html)
    if m:
        at = m.end()
        return html[:at] + tags + link + html[at:], 'html-top'
    return tags + link + html, 'prepend'


def scan_forbidden_ast(path):
    """AST verdict for `?.` / `??` (Chromium 47/56 fatal). Strings, regexes and
    comments can never produce false positives here (RC-01)."""
    script = (
        "const acorn=require(%s);const fs=require('fs');"
        "const src=fs.readFileSync(%s,'utf8');"
        "let ast;try{ast=acorn.parse(src,{ecmaVersion:2022,locations:true});}"
        "catch(e){console.log(JSON.stringify({parseError:e.message}));process.exit(2);}"
        "const hits=[];(function walk(n){if(!n||typeof n.type!=='string')return;"
        "if(n.type==='ChainExpression')hits.push([n.loc.start.line,'?.']);"
        "if(n.type==='LogicalExpression'&&n.operator==='??')hits.push([n.loc.start.line,'??']);"
        "for(const k in n){const c=n[k];if(Array.isArray(c))c.forEach(walk);else if(c&&typeof c.type==='string')walk(c);}})(ast);"
        "console.log(JSON.stringify(hits));"
    ) % (json.dumps(str(tizen3_modules() / 'acorn')), json.dumps(str(path)))
    p = subprocess.run([node(), '-e', script], capture_output=True, text=True)
    if p.returncode == 2:
        return {'parseError': (p.stdout or p.stderr)[-300:]}
    if p.returncode != 0:
        raise RuntimeError('AST scan failed for %s: %s' % (path, (p.stderr or p.stdout)[-500:]))
    return json.loads(p.stdout.strip() or '[]')


def eight_digit_hex_to_rgba(css):
    """Build-time conversion of #RRGGBBAA / #RGBA to rgba() for old WebKit (RC-04)."""
    def conv(m):
        full, hx = m.group(0), m.group(1)
        if len(hx) == 4:
            hx = ''.join(c * 2 for c in hx)
        r, g, b, a = int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16), int(hx[6:8], 16) / 255.0
        return 'rgba(%d,%d,%d,%s)' % (r, g, b, ('%.3f' % a).rstrip('0').rstrip('.'))
    return re.sub(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{4})\b', conv, css)


def check_stale(candidate_version, source_version):
    """Warn (not fail) when the candidate base predates the current source."""
    def parts(v):
        return [int(x) for x in re.findall(r'\d+', v)]
    if parts(candidate_version) < parts(source_version):
        print('STALE-NOTE: candidate %s derives from older base than source %s; '
              'recorded in validation.json' % (candidate_version, source_version))
        return True
    return False


def write_validation(path, payload):
    p = Path(path)
    p.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    print(json.dumps(payload, indent=2))
    return payload
