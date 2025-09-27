# backend_Ai/utils.py
from typing import Dict, List
import numpy as np
from PIL import Image
import io

def preprocess_image(image_bytes) -> np.ndarray:
    """แปลงรูปภาพเป็น tensor สำหรับโมเดล"""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    img_array = np.array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

def get_embedding(model, image_bytes) -> List[float]:
    """
    ดึง embedding จากรูปภาพ
    ใช้ MobileNetV2 เพื่อดึง feature vector
    """
    img_tensor = preprocess_image(image_bytes)
    embedding = model.predict(img_tensor)
    return embedding[0]

def _dist(a, b) -> float:
    """คำนวณระยะห่างระหว่าง landmark 2 จุด (Euclidean distance)"""
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5

def extract_body_widths(lm) -> Dict[str, float]:
    """
    รับ pose_landmarks.landmark (33 จุด) แล้วคืนสัดส่วนเชิงสัมพัทธ์
    """
    L_SHOULDER, R_SHOULDER = 11, 12
    L_HIP, R_HIP = 23, 24
    L_RIB, R_RIB = 11, 12
    L_WAIST, R_WAIST = 23, 24

    shoulder_width = _dist(lm[L_SHOULDER], lm[R_SHOULDER])
    hip_width = _dist(lm[L_HIP], lm[R_HIP])
    rib_width = _dist(lm[L_RIB], lm[R_RIB])
    waist_width = (rib_width + hip_width) / 2 * 0.8

    return {
        "shoulder_width": float(shoulder_width),
        "hip_width": float(hip_width),
        "waist_width": float(waist_width),
    }

def classify_shape(shoulder_w: float, hip_w: float, waist_w: float) -> str:
    """จัดประเภท body shape แบบง่าย"""
    if shoulder_w <= 0 or hip_w <= 0:
        return "unknown"

    ratio_shoulder_hip = shoulder_w / hip_w

    if ratio_shoulder_hip >= 1.2:
        return "v-shape"
    if ratio_shoulder_hip <= 1 / 1.2:
        return "pear"

    highest = max(shoulder_w, hip_w)
    if waist_w >= 0.9 * highest:
        return "apple"

    return "rectangle"
