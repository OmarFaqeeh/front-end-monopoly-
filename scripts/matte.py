"""Background matting helper for prepare-characters.mjs (uses rembg; model isnet-anime suits cartoon art).

Usage: python matte.py <in_dir> <out_dir> [model]
Install once:  python -m venv .venv ; .venv/Scripts/pip install "rembg[cpu,cli]" pillow
Then run the Node tool with:  REMBG_PYTHON=.venv/Scripts/python.exe npm run characters:prepare
"""
import os
import sys

from PIL import Image
from rembg import new_session, remove

src, dst = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "isnet-anime"
os.makedirs(dst, exist_ok=True)
session = new_session(model)
for name in sorted(os.listdir(src)):
    image = Image.open(os.path.join(src, name)).convert("RGB")
    result = remove(image, session=session, post_process_mask=True)
    result.save(os.path.join(dst, name))
    print("matted", name)
