from pathlib import Path
import urllib.request, re, hashlib, tarfile
root=Path('/workspace/toolchains')
target=root/'temurin21'
if (target/'bin/javac').is_file():
 print('Temurin JDK already installed');raise SystemExit(0)
release='jdk-21.0.12.1%2B1'
page=urllib.request.urlopen('https://github.com/adoptium/temurin21-binaries/releases/expanded_assets/'+release,timeout=30).read().decode()
links=re.findall(r'href="([^"]+)"',page)
asset=next(link for link in links if re.search(r'/OpenJDK21U-jdk_x64_linux_hotspot_[^/]+\.tar\.gz$',link))
url='https://github.com'+asset
checksum=urllib.request.urlopen(url+'.sha256.txt',timeout=30).read().decode().split()[0]
archive=Path('/tmp/ceramica-jdk.tar.gz');digest=hashlib.sha256()
with urllib.request.urlopen(url,timeout=60) as response,archive.open('wb') as out:
 while chunk:=response.read(4*1024*1024):out.write(chunk);digest.update(chunk)
if digest.hexdigest()!=checksum:raise RuntimeError('JDK SHA-256 verification failed')
print('Official Temurin JDK checksum verified',flush=True)
with tarfile.open(archive) as tar:
 folder=tar.getnames()[0].split('/')[0]
 tar.extractall(root,filter='data')
(root/folder).rename(target)
archive.unlink()
print('Temurin JDK installed')
