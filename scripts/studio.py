# The product studio: turns the owner's raw phone photo of a piece into the site's product shots.
# Cut the piece out (BiRefNet), neutralise the colour cast measured on the photo's own ground, give the gold its
# contrast and sparkle back, then set it on the vault ground under a soft light with a contact shadow.
# The piece itself is only corrected, never redrawn: what the customer sees is what is in the case.
#
# Usage (Git Bash):  "$LOCALAPPDATA/leon-studio-venv/Scripts/python.exe" -I scripts/studio.py <slug> <raw photo> [...]
# Writes public/products/<slug>/<n>.webp (4:5, 1600 high), <n>-cut.png (transparent master) and
# products/proof/<slug>-<n>.jpg (before | after, for checking). Env: MODEL (default birefnet-general), WARM (0-1).
import os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps
import cv2
from rembg import new_session, remove

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT = np.array([6, 20, 14], np.float32)       # --vault #06140e
GLOW = np.array([24, 70, 50], np.float32)       # the lit centre of the vault, toward --green-2
W, H = 1280, 1600                               # 4:5, the card and the case
MODEL = os.environ.get("MODEL", "birefnet-general")
WARM = float(os.environ.get("WARM", "0.15"))     # how much extra warmth the gold gets (kept small: 750 stays 750)

def cutout(img, session):
    rgba = remove(img, session=session, post_process_mask=True)
    a = np.asarray(rgba)[..., 3].astype(np.float32) / 255
    # a soft edge one pixel wide, so the piece does not look scissored onto the ground
    a = cv2.GaussianBlur(a, (0, 0), 0.7)
    return a

def holes(rgb, a):
    # the inside of a ring or a chain loop that the model kept: closed patches of the photo's own ground colour.
    # Only sizeable patches (a white stone is not the ground's exact tone, and is small) are opened.
    ground = rgb[a < 0.02]
    if len(ground) < 500 or os.environ.get("HOLES") == "0": return a
    lab = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    g = cv2.cvtColor(np.median(ground, axis=0).reshape(1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)[0, 0]
    chroma = np.hypot(lab[..., 1] - 128, lab[..., 2] - 128)
    obj = a > 0.5
    if np.median(chroma[obj]) > 22:
        # yellow or rose gold: the ground left inside is any colourless, not-dark patch (shadowed paper too)
        like = (chroma < 14) & (lab[..., 0] > g[0] * 0.55) & obj
    else:
        # white gold, silver, pearls: only the ground's own tone, so the metal itself is never opened
        like = (np.linalg.norm(lab - g, axis=2) < 9) & obj
    like = cv2.morphologyEx(like.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(like, 8)
    area = (a > 0.5).sum()
    cut = np.zeros(a.shape, np.float32)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > area * 0.01: cut[lbl == i] = 1
    if not cut.any(): return a
    # grow a little into the anti-aliased rim, then feather
    cut = cv2.GaussianBlur(cv2.dilate(cut, np.ones((3, 3), np.uint8)), (0, 0), 1.0)
    return a * (1 - cut)

def neutralise(rgb, a):
    # the photo's own ground (paper, cloth, table) should be grey; its cast is the light's cast on the gold too
    ground = rgb[a < 0.02]
    if len(ground) < 500: return rgb
    g = np.median(ground, axis=0) + 1
    gain = g.mean() / g
    gain = 1 + (gain - 1) * 0.85                 # not all the way: a warm room is part of the photo
    return np.clip(rgb * gain, 0, 255)

def polish(rgb, a):
    obj = a > 0.5
    lab = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0]
    # levels on the piece only: its darkest 0.5% to black-ish, its brightest 0.3% to white (the highlights of polished gold)
    lo, hi = np.percentile(L[obj], [0.5, 99.7]) if obj.sum() > 200 else (0, 255)
    L = np.clip((L - lo) / max(hi - lo, 1) * 245 + 4, 0, 255)
    # local contrast: the facets and engraving read again
    clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8))
    L = 0.55 * L + 0.45 * clahe.apply(L.astype(np.uint8)).astype(np.float32)
    lab[..., 0] = L
    # a little warmth into the gold (b channel = yellow), only where it is already yellow
    b = lab[..., 2] - 128
    lab[..., 2] = 128 + np.where(b > 0, b * (1 + WARM), b)
    lab[..., 1] = 128 + (lab[..., 1] - 128) * 1.04
    out = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    # denoise the phone grain, then sharpen what is left
    out = cv2.fastNlMeansDenoisingColored(out, None, 3, 3, 5, 15)
    blur = cv2.GaussianBlur(out, (0, 0), 1.2)
    out = cv2.addWeighted(out, 1.6, blur, -0.6, 0)
    return out.astype(np.float32)

def stage(rgb, a):
    ys, xs = np.where(a > 0.08)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb, a = rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]
    h, w = a.shape
    # the piece fills 74% of the frame's limiting side, sitting a little above the middle
    s = min(W * 0.74 / w, H * 0.66 / h)
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    rgb = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_LANCZOS4 if s > 1 else cv2.INTER_AREA)
    a = np.clip(cv2.resize(a, (nw, nh), interpolation=cv2.INTER_LINEAR), 0, 1)
    ox, oy = (W - nw) // 2, int((H - nh) * 0.44)

    # the ground: vault green, lit from above behind the piece
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W / 2, oy + nh * 0.45
    d = np.sqrt(((xx - cx) / (W * 0.62)) ** 2 + ((yy - cy) / (H * 0.5)) ** 2)
    k = np.clip(1 - d, 0, 1) ** 1.8
    bg = VAULT + (GLOW - VAULT) * k[..., None]
    bg += np.random.default_rng(7).normal(0, 0.9, bg.shape).astype(np.float32)  # no banding in the gradient

    # contact shadow: the piece's own silhouette, squashed and blurred under it
    full = np.zeros((H, W), np.float32); full[oy:oy + nh, ox:ox + nw] = a
    sh = cv2.GaussianBlur(np.roll(full, int(nh * 0.03), axis=0), (0, 0), max(6, nh * 0.025)) * 0.55
    floor = np.zeros((H, W), np.float32)
    cv2.ellipse(floor, (W // 2, oy + nh), (int(nw * 0.42), max(4, int(nh * 0.035))), 0, 0, 360, 1, -1)
    sh = np.maximum(sh, cv2.GaussianBlur(floor, (0, 0), max(8, nh * 0.03)) * 0.6)
    bg *= (1 - sh)[..., None]

    canvas = bg.copy()
    piece = np.zeros_like(bg); piece[oy:oy + nh, ox:ox + nw] = rgb
    canvas = canvas * (1 - full[..., None]) + piece * full[..., None]
    return np.clip(canvas, 0, 255).astype(np.uint8), (x0, y0, x1, y1)

def frame(img, crop):
    # an already staged photo (a poster): no cutout, only a 4:5 crop that leaves its text and logos out,
    # a clean resize, a little sharpening, and edges that fade into the vault so it sits in the card
    x, y, w = crop
    # ERASE=x,y,w,h[;...]: poster text lying on the ground (never on the piece) is filled in from the ground around it
    if os.environ.get("ERASE"):
        a = np.asarray(img).copy(); m = np.zeros(a.shape[:2], np.uint8)
        for r in os.environ["ERASE"].split(";"):
            ex, ey, ew, eh = [int(v) for v in r.split(",")]; m[ey:ey + eh, ex:ex + ew] = 255
        img = Image.fromarray(cv2.inpaint(a, m, 9, cv2.INPAINT_TELEA))
    img = img.crop((x, y, x + w, y + round(w * H / W)))
    s = W / w
    shot = np.asarray(img.resize((W, H), Image.LANCZOS)).astype(np.float32)
    blur = cv2.GaussianBlur(shot, (0, 0), 1.0 + 0.6 * max(0, s - 1))
    shot = cv2.addWeighted(shot, 1.35 if s > 1.5 else 1.25, blur, -0.35 if s > 1.5 else -0.25, 0)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    edge = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]) / (W * 0.09)
    k = np.clip(edge, 0, 1) ** 0.8
    shot = VAULT + (shot - VAULT) * (0.55 + 0.45 * k)[..., None]
    return np.clip(shot, 0, 255).astype(np.uint8)

def main():
    slug, files = sys.argv[1], sys.argv[2:]
    if os.environ.get("CROP"):
        # Usage: CROP=x,y,w studio.py <slug> <poster>  (height follows from 4:5)
        out = os.path.join(ROOT, "public", "products", slug); os.makedirs(out, exist_ok=True)
        n = int(os.environ.get("N", "1"))
        crop = [int(v) for v in os.environ["CROP"].split(",")]
        img = ImageOps.exif_transpose(Image.open(files[0])).convert("RGB")
        Image.fromarray(frame(img, crop)).save(os.path.join(out, f"{n}.webp"), quality=88, method=6)
        print(f"{slug}/{n}.webp  framed from {os.path.basename(files[0])} at {crop}")
        return
    out = os.path.join(ROOT, "public", "products", slug); os.makedirs(out, exist_ok=True)
    proof = os.path.join(ROOT, "products", "proof"); os.makedirs(proof, exist_ok=True)
    session = new_session(MODEL)
    for n, f in enumerate(files, 1):
        img = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        img.thumbnail((2400, 2400), Image.LANCZOS)
        a = cutout(img, session)
        rgb = np.asarray(img).astype(np.float32)
        a = holes(rgb, a)
        rgb = polish(neutralise(rgb, a), a)
        shot, box = stage(rgb, a)
        Image.fromarray(shot).save(os.path.join(out, f"{n}.webp"), quality=88, method=6)
        x0, y0, x1, y1 = box
        cut = np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8)[y0:y1, x0:x1]
        Image.fromarray(cut, "RGBA").save(os.path.join(out, f"{n}-cut.png"), optimize=True)
        # before | after, same height, for the owner and for checking the cutout
        before = img.copy(); before.thumbnail((10000, 900)); after = Image.fromarray(shot).resize((720, 900), Image.LANCZOS)
        sheet = Image.new("RGB", (before.width + 720 + 20, 900), (6, 20, 14))
        sheet.paste(before, (0, 0)); sheet.paste(after, (before.width + 20, 0))
        sheet.save(os.path.join(proof, f"{slug}-{n}.jpg"), quality=85)
        print(f"{slug}/{n}.webp  {W}x{H}  from {os.path.basename(f)}")

if __name__ == "__main__":
    main()
