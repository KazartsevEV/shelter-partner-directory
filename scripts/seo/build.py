#!/usr/bin/env python3
"""Generate/check SEO pages with the shared RU/EN/KK renderer."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if __name__ == '__main__':
    subprocess.run(['node', str(ROOT / 'scripts/seo/build_pages.cjs'), *sys.argv[1:]], cwd=ROOT, check=True)
