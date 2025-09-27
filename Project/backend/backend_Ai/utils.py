from typing import Dict, List
import numpy as np
from PIL import Image, ImageOps
import io

# =========================
# Preprocess & Embeddings
# =========================

def _five_crops(image: Image.Image, size=224):
    """คืนภาพ 5 ครอป (4 มุม + กลาง) ขนาด size x size"""
    w, h = image.size
    if w < size or h < size:
        image = image.resize((max(w, size), max(h, size)))
        w, h = image.size
    boxes = [
        (0, 0, size, size),                              # top-left
        (w - size, 0, w, size),                          # top-right
        (0, h - size, size, h),                          # bottom-left
        (w - size, h - size, w, h),                      # bottom-right
        ((w - size)//2, (h - size)//2,
         (w + size)//2, (h + size)//2),                 # center
    ]
    return [image.crop(b).resize((size, size)) for b in boxes]

def get_embedding(model, image_bytes, preprocess_fn=None) -> np.ndarray:
    """
    ดึง embedding จากภาพเดียว (ใช้กับบางจุดที่ต้องการเร็วสุด)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    x = np.asarray(img, dtype=np.float32)[None, ...]  # (1,224,224,3)
    if preprocess_fn is not None:
        x = preprocess_fn(x)
    emb = model.predict(x, verbose=0)
    return emb[0].astype("float32")

def get_embedding_tta(model, image_bytes, preprocess_fn=None) -> np.ndarray:
    """
    TTA แบบ 5-crop + horizontal flip (รวม 10 มุมมอง) แล้วเฉลี่ย
    - เพิ่มความทนต่อการจัดวาง/พื้นหลัง/ท่าทาง
    - ใช้ preprocess_fn ให้ตรงกับโมเดล
    """
    base = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    variants = _five_crops(base, 224) + _five_crops(ImageOps.mirror(base), 224)

    embs = []
    for im in variants:
        x = np.asarray(im, dtype=np.float32)[None, ...]
        if preprocess_fn is not None:
            x = preprocess_fn(x)
        e = model.predict(x, verbose=0)[0].astype("float32")
        embs.append(e)

    emb = np.mean(embs, axis=0).astype("float32")
    return emb

# =========================
# Body Landmarks Utilities
# =========================

def _dist(a, b) -> float:
    """คำนวณระยะ Euclidean ระหว่าง landmark 2 จุด (ใช้กับ MediaPipe Pose)"""
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5

def extract_body_widths(lm) -> Dict[str, float]:
    """
    รับ pose_landmarks.landmark (33 จุด) แล้วคืนสัดส่วนเชิงสัมพัทธ์
    หมายเหตุ: ตัวอย่างนี้ประมาณเอวจากค่าเฉลี่ยไหล่/สะโพก
    """
    L_SHOULDER, R_SHOULDER = 11, 12
    L_HIP, R_HIP         = 23, 24

    shoulder_width = _dist(lm[L_SHOULDER], lm[R_SHOULDER])
    hip_width      = _dist(lm[L_HIP], lm[R_HIP])
    waist_width    = (shoulder_width + hip_width) / 2 * 0.8

    return {
        "shoulder_width": float(shoulder_width),
        "hip_width": float(hip_width),
        "waist_width": float(waist_width),
    }

def classify_shape(shoulder_w: float, hip_w: float, waist_w: float) -> str:
    """
    จัดประเภท body shape แบบง่ายจากอัตราส่วนไหล่/สะโพก/เอว
    """
    if shoulder_w <= 0 or hip_w <= 0:
        return "unknown"

    ratio = shoulder_w / hip_w
    if ratio >= 1.2:
        return "v-shape"
    if ratio <= 1 / 1.2:
        return "pear"
    if waist_w >= 0.9 * max(shoulder_w, hip_w):
        return "apple"
    return "rectangle"
