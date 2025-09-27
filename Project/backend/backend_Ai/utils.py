# backend_Ai/utils.py
from typing import Dict, Tuple, Optional

def _dist(a, b) -> float:
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5

def extract_body_widths(lm) -> Dict[str, float]:
    """
    รับ pose_landmarks.landmark (33 จุด) แล้วคืนสัดส่วนเชิงสัมพัทธ์:
    - shoulder_width: ระยะไหล่ซ้าย–ขวา
    - hip_width: ระยะสะโพกซ้าย–ขวา
    - waist_width: ประมาณเอว (กลางเส้นสะโพก–ซี่โครงล่าง)
    """
    # index อ้างอิงจาก MediaPipe Pose
    L_SHOULDER, R_SHOULDER = 11, 12
    L_HIP, R_HIP = 23, 24
    L_RIB, R_RIB = 11, 12      # ใช้ไหล่เป็น proxy จุดซี่โครง
    L_WAIST, R_WAIST = 23, 24  # ใช้สะโพกเป็น proxy ใกล้เอว

    shoulder_width = _dist(lm[L_SHOULDER], lm[R_SHOULDER])
    hip_width = _dist(lm[L_HIP], lm[R_HIP])

    # “เอว” ประมาณจากจุดกึ่งกลางระหว่างซี่โครง (ไหล่) กับสะโพก
    # แล้วหาความกว้างโดยคิดว่าความกว้างใกล้ค่ากลางระหว่างสองเส้น
    rib_width = _dist(lm[L_RIB], lm[R_RIB])
    waist_width = (rib_width + hip_width) / 2 * 0.8  # ลดลงเล็กน้อยเป็นเอว

    return {
        "shoulder_width": float(shoulder_width),
        "hip_width": float(hip_width),
        "waist_width": float(waist_width),
    }

def classify_shape(shoulder_w: float, hip_w: float, waist_w: float) -> str:
    """
    กฎง่าย ๆ:
      - V-shape: ไหล่ > สะโพก 20%+
      - Pear:   สะโพก > ไหล่ 20%+
      - Apple:  เอว ~ ใกล้ไหล่/สะโพก (เอวไม่ยุบ) และเอว >= 90% ของ max(ไหล่,สะโพก)
      - Rectangle: ที่เหลือ
    """
    if shoulder_w <= 0 or hip_w <= 0:
        return "unknown"

    # ทำให้สเกลเป็นกลาง (ภาพใกล้/ไกลไม่กระทบเพราะเทียบเป็นสัดส่วน)
    ratio_shoulder_hip = shoulder_w / hip_w

    if ratio_shoulder_hip >= 1.2:
        return "v-shape"
    if ratio_shoulder_hip <= 1/1.2:
        return "pear"

    highest = max(shoulder_w, hip_w)
    if waist_w >= 0.9 * highest:
        return "apple"

    return "rectangle"
