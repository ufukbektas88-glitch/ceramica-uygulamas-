from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json, os, re
root=Path(__file__).resolve().parent.parent
web=root/'apps/mobile/build/web'
if not (web/'main.dart.js').exists():raise SystemExit('Build Flutter web first')
index=web/'index.html'
html=index.read_text().replace('<base href="/">','<base href="./">')
registration="<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>console.info('Çevrimdışı önbellek kurulamadı.')));}</script>"
if registration not in html:html=html.replace('</body>',registration+'\n</body>')
index.write_text(html)
bootstrap=web/'flutter_bootstrap.js'
bootstrap.write_text(re.sub(r'_flutter\.loader\.load\(\{\s*serviceWorkerSettings:.*?\n\}\);', '_flutter.loader.load({});', bootstrap.read_text(), flags=re.S))
(web/'.nojekyll').touch()
version=hashlib.sha256((web/'main.dart.js').read_bytes()).hexdigest()[:12]
assets=['./'+p.relative_to(web).as_posix() for p in sorted(web.rglob('*')) if p.is_file() and p.name!='sw.js' and not p.name.endswith('.map')]
assets+=['./']
sw="const CACHE='ceramica-showroom-"+version+"';\nconst ASSETS="+json.dumps(assets)+";\n"
sw+="self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));\n"
sw+="self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('ceramica-showroom-')||k.startsWith('flutter-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\n"
sw+="self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});\n"
(web/'sw.js').write_text(sw)
output=Path(os.environ.get('CERAMICA_OUTPUT_DIR','/workspace'));output.mkdir(parents=True,exist_ok=True)
target=output/'CERAMICA-web-katalog.zip'
with ZipFile(target,'w',ZIP_DEFLATED) as z:
 for p in sorted(web.rglob('*')):
  if p.is_file() and not p.name.endswith('.map'):z.write(p,p.relative_to(web))
mobile=root/'apps/mobile'
with ZipFile(output/'CERAMICA-iOS-kaynak.zip','w',ZIP_DEFLATED) as z:
 for name in ['lib','assets','ios']:
  for p in sorted((mobile/name).rglob('*')):
   if p.is_file() and not any(part in ['Pods','.symlinks','ephemeral'] for part in p.parts) and p.name not in ['Generated.xcconfig','flutter_export_environment.sh']:z.write(p,p.relative_to(mobile))
 for name in ['pubspec.yaml','pubspec.lock','analysis_options.yaml','README.md','.fvmrc']:
  z.write(mobile/name,name)
print('Packaged optional web catalog and native iOS source; no signed IPA claimed.')
