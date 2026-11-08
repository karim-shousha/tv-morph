"""Build only active website downloads; retain history in the public manifest."""
import argparse
import concurrent.futures
import hashlib
import json
import pathlib
import threading
import time
import urllib.parse
import urllib.request

PLATFORM_FILES = ('computerPackage', 'computerCompatibilityPackage',
                  'experimentalTizen2', 'experimentalTizen3',
                  'computerLite2Package', 'computerLite3Package',
                  'computerBundle', 'computerCompatibilityBundle')
release_cache = {}
release_lock = threading.Lock()


def active_rows(manifest, catalog):
    names = {row['file'] for row in catalog.get('releases', [])}
    names.update(row['file'] for row in catalog.get('iptv', {}).get('releases', []))
    names.update(catalog.get('downloads', {}).values())
    for platform in catalog.get('platforms', []):
        for field in PLATFORM_FILES:
            if platform.get(field):
                names.add(pathlib.PurePosixPath(urllib.parse.urlsplit(platform[field]).path).name)
    # Desktop downloads already redirect to GitHub. Do not copy their historical
    # universal archives into every website image.
    rows = [row for row in manifest['artifacts'] if row['file'] in names
            and row.get('target') not in ('mac', 'windows')]
    seen = set()
    for row in rows:
        name = row['file']
        if pathlib.PurePosixPath(name).name != name or '\\' in name or name in seen:
            raise ValueError('Invalid or duplicate release filename: ' + name)
        if len(row['sha256']) != 64 or row['bytes'] <= 0:
            raise ValueError('Invalid release integrity metadata: ' + name)
        seen.add(name)
    return rows


def api_download(url):
    parsed = urllib.parse.urlsplit(url)
    parts = parsed.path.split('/')
    if parsed.hostname != 'github.com' or len(parts) != 7 or parts[3:5] != ['releases', 'download']:
        return url
    owner, repo, tag, filename = parts[1], parts[2], parts[5], urllib.parse.unquote(parts[6])
    endpoint = f'https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag}'
    with release_lock:
        if endpoint not in release_cache:
            request = urllib.request.Request(endpoint, headers={'User-Agent': 'MorphReleaseBuild/1'})
            with urllib.request.urlopen(request, timeout=40) as response:
                release_cache[endpoint] = json.load(response)
        release = release_cache[endpoint]
    return next(asset['url'] for asset in release['assets'] if asset['name'] == filename)


def fetch(row, output, base_url, retry_delay=3):
    name = row['file']
    target = output / name
    if target.is_file() and target.stat().st_size == row['bytes']:
        with target.open('rb') as source:
            if hashlib.file_digest(source, 'sha256').hexdigest() == row['sha256']:
                print('Verified cached', name, flush=True)
                return
    original = row.get('url') or base_url + urllib.parse.quote(name)
    partial = output / (name + '.part')
    for attempt in range(3):
        try:
            url = original if attempt == 0 else api_download(original)
            request = urllib.request.Request(url, headers={
                'User-Agent': 'MorphReleaseBuild/1',
                'Accept': 'application/octet-stream', 'Accept-Encoding': 'identity'})
            digest, size = hashlib.sha256(), 0
            with urllib.request.urlopen(request, timeout=90) as response, partial.open('wb') as dest:
                while block := response.read(1024 * 1024):
                    size += len(block)
                    if size > row['bytes']:
                        raise ValueError('Download larger than verified package')
                    dest.write(block)
                    digest.update(block)
            if size != row['bytes'] or digest.hexdigest() != row['sha256']:
                raise ValueError('Release size/SHA256 mismatch')
            partial.replace(target)
            print('Verified', name, size, flush=True)
            return
        except Exception as error:
            partial.unlink(missing_ok=True)
            print('Download attempt', attempt + 1, name, type(error).__name__, str(error), flush=True)
            if attempt == 2:
                raise
            time.sleep(retry_delay * (attempt + 1))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', default='/release-artifacts.json')
    parser.add_argument('--catalog', default='/catalog.json')
    parser.add_argument('--out', default='/artifacts')
    parser.add_argument('--plan', action='store_true')
    args = parser.parse_args()
    manifest = json.loads(pathlib.Path(args.manifest).read_text())
    catalog = json.loads(pathlib.Path(args.catalog).read_text())
    rows = active_rows(manifest, catalog)
    plan = {'files': len(rows), 'bytes': sum(row['bytes'] for row in rows),
            'filenames': [row['file'] for row in rows]}
    print(json.dumps(plan), flush=True)
    if args.plan:
        return
    output = pathlib.Path(args.out)
    output.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as workers:
        list(workers.map(lambda row: fetch(row, output, manifest['baseUrl']), rows))


if __name__ == '__main__':
    main()
