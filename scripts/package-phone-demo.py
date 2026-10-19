# Compatibility entry point: no separate demo product data is maintained.
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('package-showroom.py')),run_name='__main__')
