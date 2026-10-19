from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent / 'apps/phone-demo'
target = Path('/workspace/CERAMICA-iPhone-web-demo.zip')
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for file in sorted(root.rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(root))
print(f'Phone web demo packaged: {target.name} ({target.stat().st_size} bytes)')
