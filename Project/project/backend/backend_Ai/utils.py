# backend_Ai/utils.py
from typing import Dict, List, Optional
import numpy as np
from PIL import Image, ImageOps
import io
import math

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
        (0, 0, size, size),                               # top-left
        (w - size, 0, w, size),                           # top-right
        (0, h - size, size, h),                           # bottom-left
        (w - size, h - size, w, h),                       # bottom-right
        ((w - size)//2, (h - size)//2,
         (w + size)//2, (h + size)//2),                  # center
    ]
    return [image.crop(b).resize((size, size)) for b in boxes]

def get_embedding(model, image_bytes, preprocess_fn=None) -> np.ndarray:
    """ดึง embedding จากภาพเดียว (ใช้กับบางจุดที่ต้องการเร็วสุด)"""
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
    L_HIP, R_HIP           = 23, 24

    shoulder_width = _dist(lm[L_SHOULDER], lm[R_SHOULDER])
    hip_width      = _dist(lm[L_HIP], lm[R_HIP])
    waist_width    = (shoulder_width + hip_width) / 2 * 0.8

    return {
        "shoulder_width": float(shoulder_width),
        "hip_width": float(hip_width),
        "waist_width": float(waist_width),
    }

def classify_shape(shoulder_w: float, hip_w: float, waist_w: float) -> str:
    """จัดประเภท body shape แบบง่ายจากอัตราส่วนไหล่/สะโพก/เอว"""
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

# =========================
# Chest circumference helpers
# =========================

def ellipse_circumference_ramanujan(a: float, b: float) -> float:
    """ประมาณเส้นรอบวงของวงรี (a,b = กึ่งแกนเป็นเซนติเมตร)"""
    return math.pi * (3*(a+b) - math.sqrt((3*a+b)*(a+3*b)))

def chest_depth_ratio_auto(gender: Optional[str], height_cm: float, weight_kg: float) -> float:
    """
    ประมาณสัดส่วนความลึกหน้าอกจากความกว้าง (depth = ratio * width)
    - เพศ: men≈0.80, women≈0.72, unknown≈0.76
    - ปรับตาม BMI: ratio += clamp((BMI-22)*0.006, -0.06, +0.10)
    - จำกัดช่วง ratio 0.60..1.00
    """
    h_m = max(height_cm / 100.0, 0.01)
    bmi = float(weight_kg) / (h_m * h_m)
    base = 0.76
    g = (gender or "").lower()
    if g == "men":
        base = 0.80
    elif g == "women":
        base = 0.72
    delta = (bmi - 22.0) * 0.006
    delta = max(-0.06, min(0.10, delta))
    ratio = max(0.60, min(1.00, base + delta))
    return ratio

def estimate_chest_circumference_cm(
    lm,
    img_w: int,
    img_h: int,
    height_cm: float,
    weight_kg: float | None = None,
    gender: Optional[str] = None,
    body_height_norm_fn=None,         # validators.body_height_norm
    chest_level: float = 0.33,        # 0..1 ระดับอกจากไหล่ลงสะโพก
    side_depth_cm: float | None = None,
    fixed_depth_ratio: float | None = None,
):
    """
    คำนวณรอบอก (cm) จาก landmark + ส่วนสูงจริง (cm) + (ออปชัน) น้ำหนัก/เพศ
    - ถ้ามี side_depth_cm → ใช้เป็นความลึกจริง
    - ถ้าไม่มี → ใช้ fixed_depth_ratio ถ้าส่งมา, ไม่งั้นคำนวณ auto จาก gender+BMI
    """
    from .validators import chest_line_points, body_height_norm

    if lm is None:
        return {"ok": False, "reason": "no_landmarks"}

    # scale cm/px จากส่วนสูงจริง
    h_norm = body_height_norm(lm) if body_height_norm_fn is None else body_height_norm_fn(lm)
    if height_cm is None or height_cm <= 0 or h_norm <= 0:
        return {"ok": False, "reason": "need_height_or_bad_pose"}

    px_body_h = h_norm * img_h
    cm_per_px = height_cm / (px_body_h + 1e-6)

    # แนวอก: จุดซ้าย/ขวา
    Lpx, Rpx = chest_line_points(lm, img_w, img_h, level=chest_level)
    if Lpx is None or Rpx is None:
        return {"ok": False, "reason": "chest_line_unavailable"}

    dx = (Rpx[0] - Lpx[0]); dy = (Rpx[1] - Lpx[1])
    chest_width_px = (dx*dx + dy*dy) ** 0.5
    chest_width_cm = chest_width_px * cm_per_px

    # ความลึกหน้าอก
    if side_depth_cm and side_depth_cm > 0:
        chest_depth_cm = float(side_depth_cm)
        depth_src = "side_photo"
    else:
        if fixed_depth_ratio is not None:
            ratio = fixed_depth_ratio
        else:
            ratio = chest_depth_ratio_auto(gender, height_cm, weight_kg or 0.0)
        chest_depth_cm = chest_width_cm * ratio
        depth_src = f"ratio:{ratio:.3f}"

    a = chest_width_cm / 2.0
    b = chest_depth_cm / 2.0
    circumference = ellipse_circumference_ramanujan(a, b)

    return {
        "ok": True,
        "cm_per_px": cm_per_px,
        "width_cm": chest_width_cm,
        "depth_cm": chest_depth_cm,
        "depth_source": depth_src,
        "circumference_cm": circumference,
        "chest_level": chest_level,
    }
