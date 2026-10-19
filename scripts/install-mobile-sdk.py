import json,urllib.request,urllib.parse,hashlib,tarfile,pathlib,subprocess
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  r=super().redirect_request(req,fp,code,msg,headers,newurl)
  if urllib.parse.urlsplit(req.full_url).netloc!=urllib.parse.urlsplit(newurl).netloc:r.remove_header('Authorization')
  return r
opener=urllib.request.build_opener(SafeRedirect())
root=pathlib.Path('/workspace/toolchains/flutter-3.44.0');root.mkdir(parents=True,exist_ok=True)
if (root/'.ceramica-sdk-ready').is_file():
 print('Pinned Flutter SDK already installed');raise SystemExit(0)
m=json.loads(subprocess.check_output(['docker','manifest','inspect','ghcr.io/cirruslabs/flutter@sha256:0a9de3b70b5b7b921a346eb2793e363dc22280849a4fd690d9dde99ce1c2b1b8'],text=True))
for index in [1,3,4,5,6]:
 layer=m['layers'][index];expected=layer['digest'].split(':')[1];archive=pathlib.Path('/tmp/ceramica-sdk-layer-'+str(index)+'.tgz')
 print('Downloading verified SDK layer',index,round(layer['size']/1e6),'MB',flush=True)
 token=json.load(opener.open('https://ghcr.io/token?service=ghcr.io&scope=repository:cirruslabs/flutter:pull',timeout=30))['token']
 request=urllib.request.Request('https://ghcr.io/v2/cirruslabs/flutter/blobs/'+layer['digest'],headers={'Authorization':'Bearer '+token})
 digest=hashlib.sha256()
 with opener.open(request,timeout=60) as response,archive.open('wb') as out:
  while chunk:=response.read(4*1024*1024):out.write(chunk);digest.update(chunk)
 if digest.hexdigest()!=expected:raise RuntimeError('SDK checksum mismatch')
 print('Checksum OK; extracting SDK directories',index,flush=True)
 with tarfile.open(archive) as tar:
  for member in tar:
   name=member.name.lstrip('./')
   if not (name.startswith('sdks/flutter/') or name.startswith('opt/android-sdk-linux/')):continue
   if '/.wh.' in name:continue
   tar.extract(member,root,filter='data')
 archive.unlink()
(root/'.ceramica-sdk-ready').write_text('ghcr.io/cirruslabs/flutter@sha256:0a9de3b70b5b7b921a346eb2793e363dc22280849a4fd690d9dde99ce1c2b1b8\n')
print('Flutter and Android SDK files prepared',flush=True)
