# backend_Ai/validators.py
# --------------------------------------------
# เครื่องมือตรวจคุณภาพท่าทาง + ตัวช่วยคำนวณเบื้องต้น
# --------------------------------------------
from typing import Sequence, List
import math
import cv2  # ใช้เฉพาะใน auto_level_frame (หมุนภาพ)

# ====== ดัชนี MediaPipe Pose (33 จุด) ======
NOSE = 0
L_EAR, R_EAR = 7, 8
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28
L_HEEL, R_HEEL = 29, 30

# ------------------------------
# Utilities
# ------------------------------
def _vis_ok(p, th: float = 0.5) -> bool:
    """เช็คว่าจุด landmark มองเห็น (visibility ≥ th)"""
    return (p is not None) and (getattr(p, "visibility", 1.0) >= th)

def _get_y_list(lm: Sequence, idxs: List[int]) -> List[float]:
    """ดึงค่า y ที่ 'มองเห็น' จากชุด index ที่ให้มา (normalized [0..1])"""
    ys = []
    for i in idxs:
        p = lm[i]
        if _vis_ok(p):
            ys.append(p.y)
    return ys

# ------------------------------
# เกณฑ์พื้นฐาน: เต็มตัว + หันหน้า
# ------------------------------
def is_full_body_landmarks(lm: Sequence, require_ankles: bool = False) -> bool:
    """
    True = มีข้อมูลพอ:
      - เห็นไหล่ซ้าย/ขวา + สะโพกซ้าย/ขวา
      - และเห็น 'เข่า' หรือ 'ข้อเท้า' ครบคู่ อย่างน้อยหนึ่งคู่
    """
    torso_ok = (
        _vis_ok(lm[L_SHOULDER]) and _vis_ok(lm[R_SHOULDER]) and
        _vis_ok(lm[L_HIP]) and _vis_ok(lm[R_HIP])
    )
    if not torso_ok:
        return False

    if require_ankles:
        return _vis_ok(lm[L_ANKLE]) and _vis_ok(lm[R_ANKLE])

    legs_ok = (
        (_vis_ok(lm[L_KNEE]) and _vis_ok(lm[R_KNEE])) or
        (_vis_ok(lm[L_ANKLE]) and _vis_ok(lm[R_ANKLE]))
    )
    return legs_ok

def frontal_pose_ok(lm: Sequence, shoulder_y_delta_th: float = 0.06) -> bool:
    """คร่าว ๆ ว่า “ยืนตรงหันหน้า”: ระดับ y ของไหล่ซ้าย/ขวาไม่ต่างกันมาก (ไม่เอียง)"""
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    return abs(ls.y - rs.y) <= shoulder_y_delta_th

# ------------------------------
# การประเมินมุมเอียง/หันหน้า + เลเวลกรอบภาพ
# ------------------------------
def roll_deg(lm: Sequence) -> float:
    """มุมเอียงของเส้นไหล่ (องศา) ค่าบวก = เอียงตามเข็มนาฬิกา"""
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    return math.degrees(math.atan2((rs.y - ls.y), (rs.x - ls.x)))

def yaw_ok(lm: Sequence, tol: float = 0.15) -> bool:
    """
    ประเมินว่าหัน 'เผชิญกล้อง' หรือไม่ โดยดูตำแหน่งจมูกเทียบกลางไหล่
    - tol เป็นสัดส่วนของความกว้างไหล่ (normalized) ที่ยอมให้จมูกเบี่ยงได้
    """
    ls, rs, nose = lm[L_SHOULDER], lm[R_SHOULDER], lm[NOSE]
    if not (_vis_ok(ls) and _vis_ok(rs) and _vis_ok(nose)):
        return False
    shoulder_w = abs(rs.x - ls.x) + 1e-6
    mid_x = (ls.x + rs.x) * 0.5
    return abs(nose.x - mid_x) / shoulder_w < tol

def auto_level_frame(frame_bgr, lm: Sequence, max_correction_deg: float = 8.0):
    """หมุนภาพให้ 'เส้นไหล่' อยู่ระดับแนวนอน (แก้ roll) สูงสุด ±max_correction_deg"""
    ang = roll_deg(lm)
    if abs(ang) < 3.0:
        return frame_bgr, 0.0
    h, w = frame_bgr.shape[:2]
    ang = max(-max_correction_deg, min(max_correction_deg, ang))
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
    out = cv2.warpAffine(frame_bgr, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return out, ang

# ------------------------------
# การประเมิน 'เต็มตัว' แบบตัวเลข (เพื่อทำสเกลส่วนสูง)
# ------------------------------
def body_height_norm(lm: Sequence) -> float:
    """
    คืนสัดส่วนความสูงของร่างกายในภาพ (normalized 0..1 ของแกน Y)
    วัดจากส่วนบน (จมูก/ใบหู) ถึงส่วนล่าง (ข้อเท้า/ส้นเท้า)
    """
    tops = _get_y_list(lm, [NOSE, L_EAR, R_EAR])
    bottoms = _get_y_list(lm, [L_ANKLE, R_ANKLE, L_HEEL, R_HEEL])
    if not tops or not bottoms:
        return 0.0
    return max(bottoms) - min(tops)

# ------------------------------
# ตรวจแขนบังลำตัว
# ------------------------------
def arms_clear_torso(lm: Sequence, tol: float = 0.08) -> bool:
    """
    True = แขนไม่บังลำตัวส่วนกลางอกมากเกินไป
    หลักการ: ศอก/ข้อมือ ต้องไม่เข้าใกล้ 'เส้นกลางลำตัว' เกิน tol เท่าของความกว้างไหล่
    """
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    if not (_vis_ok(ls) and _vis_ok(rs)):
        return False
    shoulder_w = abs(rs.x - ls.x) + 1e-6
    mid_x = (ls.x + rs.x) * 0.5

    L_ELBOW, R_ELBOW = 13, 14
    L_WRIST, R_WRIST = 15, 16

    bad = 0
    for idx in (L_ELBOW, R_ELBOW, L_WRIST, R_WRIST):
        p = lm[idx]
        if _vis_ok(p) and (abs(p.x - mid_x) / shoulder_w < tol):
            bad += 1
    return bad <= 1  # อนุโลมได้ ≤ 1 จุด

# ------------------------------
# Chest line helpers (เพิ่มใหม่)
# ------------------------------
def _to_px(p, img_w: int, img_h: int):
    """แปลง landmark (normalized) เป็นพิกเซล"""
    return (p.x * img_w, p.y * img_h)

def chest_line_points(lm: Sequence, img_w: int, img_h: int, level: float = 0.33):
    """
    คืนจุดซ้าย/ขวาบน 'แนวหน้าอก' ในพิกเซล
    level: 0..1 จากไหล่ลงไปทางสะโพก (0 = ขนานไหล่, 1 = ขนานสะโพก)
    """
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    lh, rh = lm[L_HIP], lm[R_HIP]
    if not (_vis_ok(ls) and _vis_ok(rs) and _vis_ok(lh) and _vis_ok(rh)):
        return None, None

    # interpolate ซ้าย/ขวา ที่สัดส่วนเดียวกัน
    lx = ls.x + (lh.x - ls.x) * level
    ly = ls.y + (lh.y - ls.y) * level
    rx = rs.x + (rh.x - rs.x) * level
    ry = rs.y + (rh.y - rs.y) * level

    L = type(ls)(x=lx, y=ly, z=getattr(ls, "z", 0.0), visibility=getattr(ls, "visibility", 1.0))
    R = type(rs)(x=rx, y=ry, z=getattr(rs, "z", 0.0), visibility=getattr(rs, "visibility", 1.0))
    return _to_px(L, img_w, img_h), _to_px(R, img_w, img_h)
# backend_Ai/validators.py
# --------------------------------------------
# เครื่องมือตรวจคุณภาพท่าทาง + ตัวช่วยคำนวณเบื้องต้น
# --------------------------------------------
from typing import Sequence, List
import math
import cv2  # ใช้เฉพาะใน auto_level_frame (หมุนภาพ)

# ====== ดัชนี MediaPipe Pose (33 จุด) ======
NOSE = 0
L_EAR, R_EAR = 7, 8
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28
L_HEEL, R_HEEL = 29, 30

# ------------------------------
# Utilities
# ------------------------------
def _vis_ok(p, th: float = 0.5) -> bool:
    """เช็คว่าจุด landmark มองเห็น (visibility ≥ th)"""
    return (p is not None) and (getattr(p, "visibility", 1.0) >= th)

def _get_y_list(lm: Sequence, idxs: List[int]) -> List[float]:
    """ดึงค่า y ที่ 'มองเห็น' จากชุด index ที่ให้มา (normalized [0..1])"""
    ys = []
    for i in idxs:
        p = lm[i]
        if _vis_ok(p):
            ys.append(p.y)
    return ys

# ------------------------------
# เกณฑ์พื้นฐาน: เต็มตัว + หันหน้า
# ------------------------------
def is_full_body_landmarks(lm: Sequence, require_ankles: bool = False) -> bool:
    """
    True = มีข้อมูลพอ:
      - เห็นไหล่ซ้าย/ขวา + สะโพกซ้าย/ขวา
      - และเห็น 'เข่า' หรือ 'ข้อเท้า' ครบคู่ อย่างน้อยหนึ่งคู่
    """
    torso_ok = (
        _vis_ok(lm[L_SHOULDER]) and _vis_ok(lm[R_SHOULDER]) and
        _vis_ok(lm[L_HIP]) and _vis_ok(lm[R_HIP])
    )
    if not torso_ok:
        return False

    if require_ankles:
        return _vis_ok(lm[L_ANKLE]) and _vis_ok(lm[R_ANKLE])

    legs_ok = (
        (_vis_ok(lm[L_KNEE]) and _vis_ok(lm[R_KNEE])) or
        (_vis_ok(lm[L_ANKLE]) and _vis_ok(lm[R_ANKLE]))
    )
    return legs_ok

def frontal_pose_ok(lm: Sequence, shoulder_y_delta_th: float = 0.06) -> bool:
    """คร่าว ๆ ว่า “ยืนตรงหันหน้า”: ระดับ y ของไหล่ซ้าย/ขวาไม่ต่างกันมาก (ไม่เอียง)"""
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    return abs(ls.y - rs.y) <= shoulder_y_delta_th

# ------------------------------
# การประเมินมุมเอียง/หันหน้า + เลเวลกรอบภาพ
# ------------------------------
def roll_deg(lm: Sequence) -> float:
    """มุมเอียงของเส้นไหล่ (องศา) ค่าบวก = เอียงตามเข็มนาฬิกา"""
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    return math.degrees(math.atan2((rs.y - ls.y), (rs.x - ls.x)))

def yaw_ok(lm: Sequence, tol: float = 0.15) -> bool:
    """
    ประเมินว่าหัน 'เผชิญกล้อง' หรือไม่ โดยดูตำแหน่งจมูกเทียบกลางไหล่
    - tol เป็นสัดส่วนของความกว้างไหล่ (normalized) ที่ยอมให้จมูกเบี่ยงได้
    """
    ls, rs, nose = lm[L_SHOULDER], lm[R_SHOULDER], lm[NOSE]
    if not (_vis_ok(ls) and _vis_ok(rs) and _vis_ok(nose)):
        return False
    shoulder_w = abs(rs.x - ls.x) + 1e-6
    mid_x = (ls.x + rs.x) * 0.5
    return abs(nose.x - mid_x) / shoulder_w < tol

def auto_level_frame(frame_bgr, lm: Sequence, max_correction_deg: float = 8.0):
    """หมุนภาพให้ 'เส้นไหล่' อยู่ระดับแนวนอน (แก้ roll) สูงสุด ±max_correction_deg"""
    ang = roll_deg(lm)
    if abs(ang) < 3.0:
        return frame_bgr, 0.0
    h, w = frame_bgr.shape[:2]
    ang = max(-max_correction_deg, min(max_correction_deg, ang))
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
    out = cv2.warpAffine(frame_bgr, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return out, ang

# ------------------------------
# การประเมิน 'เต็มตัว' แบบตัวเลข (เพื่อทำสเกลส่วนสูง)
# ------------------------------
def body_height_norm(lm: Sequence) -> float:
    """
    คืนสัดส่วนความสูงของร่างกายในภาพ (normalized 0..1 ของแกน Y)
    วัดจากส่วนบน (จมูก/ใบหู) ถึงส่วนล่าง (ข้อเท้า/ส้นเท้า)
    """
    tops = _get_y_list(lm, [NOSE, L_EAR, R_EAR])
    bottoms = _get_y_list(lm, [L_ANKLE, R_ANKLE, L_HEEL, R_HEEL])
    if not tops or not bottoms:
        return 0.0
    return max(bottoms) - min(tops)

# ------------------------------
# ตรวจแขนบังลำตัว
# ------------------------------
def arms_clear_torso(lm: Sequence, tol: float = 0.08) -> bool:
    """
    True = แขนไม่บังลำตัวส่วนกลางอกมากเกินไป
    หลักการ: ศอก/ข้อมือ ต้องไม่เข้าใกล้ 'เส้นกลางลำตัว' เกิน tol เท่าของความกว้างไหล่
    """
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    if not (_vis_ok(ls) and _vis_ok(rs)):
        return False
    shoulder_w = abs(rs.x - ls.x) + 1e-6
    mid_x = (ls.x + rs.x) * 0.5

    L_ELBOW, R_ELBOW = 13, 14
    L_WRIST, R_WRIST = 15, 16

    bad = 0
    for idx in (L_ELBOW, R_ELBOW, L_WRIST, R_WRIST):
        p = lm[idx]
        if _vis_ok(p) and (abs(p.x - mid_x) / shoulder_w < tol):
            bad += 1
    return bad <= 1  # อนุโลมได้ ≤ 1 จุด

# ------------------------------
# Chest line helpers (เพิ่มใหม่)
# ------------------------------
def _to_px(p, img_w: int, img_h: int):
    """แปลง landmark (normalized) เป็นพิกเซล"""
    return (p.x * img_w, p.y * img_h)

def chest_line_points(lm: Sequence, img_w: int, img_h: int, level: float = 0.33):
    """
    คืนจุดซ้าย/ขวาบน 'แนวหน้าอก' ในพิกเซล
    level: 0..1 จากไหล่ลงไปทางสะโพก (0 = ขนานไหล่, 1 = ขนานสะโพก)
    """
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    lh, rh = lm[L_HIP], lm[R_HIP]
    if not (_vis_ok(ls) and _vis_ok(rs) and _vis_ok(lh) and _vis_ok(rh)):
        return None, None

    # interpolate ซ้าย/ขวา ที่สัดส่วนเดียวกัน
    lx = ls.x + (lh.x - ls.x) * level
    ly = ls.y + (lh.y - ls.y) * level
    rx = rs.x + (rh.x - rs.x) * level
    ry = rs.y + (rh.y - rs.y) * level

    L = type(ls)(x=lx, y=ly, z=getattr(ls, "z", 0.0), visibility=getattr(ls, "visibility", 1.0))
    R = type(rs)(x=rx, y=ry, z=getattr(rs, "z", 0.0), visibility=getattr(rs, "visibility", 1.0))
    return _to_px(L, img_w, img_h), _to_px(R, img_w, img_h)
