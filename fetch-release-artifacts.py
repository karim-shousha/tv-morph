import hashlib,json,pathlib,time,urllib.request,urllib.parse
manifest=json.loads(pathlib.Path('/release-artifacts.json').read_text());out=pathlib.Path('/artifacts');out.mkdir(exist_ok=True)
for row in manifest['artifacts']:
 name=row['file'];assert pathlib.Path(name).name==name
 for attempt in range(4):
  try:
   digest=hashlib.sha256();size=0
   with urllib.request.urlopen(manifest['baseUrl']+urllib.parse.quote(name),timeout=180) as response,(out/name).open('wb') as dest:
    while block:=response.read(1024*1024):dest.write(block);digest.update(block);size+=len(block)
   assert size==row['bytes'] and digest.hexdigest()==row['sha256'],name
   print('Verified',name,size,flush=True);break
  except Exception:
   if attempt==3:raise
   time.sleep(3*(attempt+1))
