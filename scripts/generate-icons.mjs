#!/usr/bin/env python3
"""Generate all app icon sizes from the plane sprite on a dark background."""
import os
import struct
import zlib
import shutil

SRC = os.path.join(os.path.dirname(__file__), '../public/assets/planes/1.png')
OUT_DIR = os.path.join(os.path.dirname(__file__), '../public/icons')
ICONSET = '/tmp/blastova.iconset'
ANDROID_DIR = os.path.join(os.path.dirname(__file__), '../android/app/src/main/res')

def run(cmd):
    print(' $', cmd)
    ret = os.system(cmd)
    if ret != 0:
        print('  ⚠ command failed with', ret)
    return ret

# --- Composite: plane centered on #080f1e dark background ---
def make_composite_png(size, out_path):
    """Use sips to resize source, then Python to composite on dark bg."""
    tmp = f'/tmp/plane_{size}.png'
    # Resize plane keeping aspect, fit within padding
    padded = int(size * 0.72)
    run(f'sips -z {padded} {padded} "{SRC}" --out "{tmp}" 2>/dev/null')

    # Composite using Python struct (write raw RGBA PNG manually)
    # Read resized plane
    import subprocess
    # Convert to raw RGBA using sips
    tmp_raw = f'/tmp/plane_{size}.raw'
    run(f'sips -s format raw "{tmp}" --out "{tmp_raw}" 2>/dev/null')

    # Fall back to just copying resized plane if compositing unavailable
    # Try PIL first
    try:
        from PIL import Image
        bg = Image.new('RGBA', (size, size), (8, 15, 30, 255))
        plane = Image.open(SRC).convert('RGBA')
        # Resize plane to padded size
        plane = plane.resize((padded, padded), Image.LANCZOS)
        # Center it
        offset = (size - padded) // 2
        bg.paste(plane, (offset, offset), plane)
        bg.save(out_path)
        print(f'  ✓ {out_path} ({size}×{size}) with PIL')
        return
    except ImportError:
        pass

    # Fallback: just resize plane directly
    run(f'sips -z {size} {size} "{SRC}" --out "{out_path}" 2>/dev/null')
    print(f'  ✓ {out_path} ({size}×{size}) resized only (install Pillow for dark bg)')

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(ICONSET, exist_ok=True)

# macOS iconset sizes
mac_sizes = [16, 32, 64, 128, 256, 512, 1024]
print('\n── macOS iconset ──')
for s in mac_sizes:
    make_composite_png(s, f'{ICONSET}/icon_{s}x{s}.png')

# Create @2x variants (copy from next size up)
for s in [16, 32, 64, 128, 256, 512]:
    src_file = f'{ICONSET}/icon_{s*2}x{s*2}.png'
    dst_file = f'{ICONSET}/icon_{s}x{s}@2x.png'
    if os.path.exists(src_file):
        shutil.copy(src_file, dst_file)

# Generate .icns
print('\n── Generating .icns ──')
run(f'iconutil -c icns "{ICONSET}" --out "{OUT_DIR}/icon.icns"')

# Main app PNG icons
print('\n── App PNG icons ──')
make_composite_png(1024, f'{OUT_DIR}/icon-1024.png')
make_composite_png(256, f'{OUT_DIR}/icon-256.png')
make_composite_png(512, f'{OUT_DIR}/icon-512.png')

# Android mipmap sizes
print('\n── Android icons ──')
android_sizes = {
    'mipmap-mdpi':    48,
    'mipmap-hdpi':    72,
    'mipmap-xhdpi':   96,
    'mipmap-xxhdpi':  144,
    'mipmap-xxxhdpi': 192,
}
for folder, size in android_sizes.items():
    dst = os.path.join(ANDROID_DIR, folder)
    os.makedirs(dst, exist_ok=True)
    make_composite_png(size, os.path.join(dst, 'ic_launcher.png'))
    make_composite_png(size, os.path.join(dst, 'ic_launcher_round.png'))

# Windows .ico (multi-size)
print('\n── Windows .ico ──')
ico_sizes = [16, 32, 48, 64, 128, 256]
ico_pngs = []
for s in ico_sizes:
    p = f'/tmp/ico_{s}.png'
    make_composite_png(s, p)
    ico_pngs.append(p)

# Build ICO file manually using Python
ico_out = f'{OUT_DIR}/icon.ico'
try:
    png_datas = [open(p, 'rb').read() for p in ico_pngs]
    n = len(ico_sizes)
    header = struct.pack('<HHH', 0, 1, n)  # reserved, type=1 (ICO), count
    offset = 6 + n * 16
    entries = b''
    for i, (s, data) in enumerate(zip(ico_sizes, png_datas)):
        w = s if s < 256 else 0
        h = s if s < 256 else 0
        size_bytes = len(data)
        entries += struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, size_bytes, offset)
        offset += size_bytes
    with open(ico_out, 'wb') as f:
        f.write(header + entries)
        for data in png_datas:
            f.write(data)
    print(f'  ✓ {ico_out}')
except Exception as e:
    print(f'  ⚠ ICO generation failed: {e}')

print('\n✅ Done. Icons in', OUT_DIR)
print('  icon.icns  → Electron macOS DMG')
print('  icon.ico   → Electron Windows EXE')
print('  icon-1024.png → PWA / web')
print('  android/app/src/main/res/mipmap-*/ic_launcher.png → APK')
