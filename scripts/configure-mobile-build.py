from pathlib import Path
import os, urllib.parse
root=Path('/workspace/toolchains')
for name in ['android-user','gradle','config','pub-cache']:(root/name).mkdir(parents=True,exist_ok=True)
path=root/'gradle/gradle.properties'
values={}
if path.exists():
 for line in path.read_text().splitlines():
  if '=' in line:
   key,value=line.split('=',1);values[key]=value
proxy=urllib.parse.urlsplit(os.environ.get('HTTPS_PROXY',os.environ.get('https_proxy','')))
if proxy.hostname:
 if proxy.username or proxy.password:raise RuntimeError('Do not copy proxy credentials into Gradle files; use platform authentication.')
 for scheme in ['http','https']:
  values[f'systemProp.{scheme}.proxyHost']=proxy.hostname
  values[f'systemProp.{scheme}.proxyPort']=str(proxy.port or 80)
 values['systemProp.http.nonProxyHosts']='localhost|127.*'
trust=Path('/etc/ssl/certs/java/cacerts')
if trust.is_file():values['systemProp.javax.net.ssl.trustStore']=str(trust)
values['org.gradle.workers.max']='2'
path.write_text('\n'.join(k+'='+v for k,v in values.items())+'\n')
print('Mobile build cache, proxy and system CA trust configured; verification remains enabled.')
