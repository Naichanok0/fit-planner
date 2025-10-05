
# backend_Ai/validators.py
from typing import Tuple, Optional

# MediaPipe Pose landmark indices (full list has 33 points)
NOSE = 0
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28

def _vis_ok(pt, thr=0.5):
    # บางเวอร์ชัน mediapipe ไม่มี visibility ให้ใช้ค่า default = 1.0
    vis = getattr(pt, "visibility", 1.0)
    return vis is None or vis >= thr

def is_full_body_landmarks(lm) -> bool:
    """ครบจุดสำคัญหัวไหล่เอวเข่าและข้อเท้า"""
    need = [NOSE, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP, L_KNEE, R_KNEE, L_ANKLE, R_ANKLE]
    try:
        for i in need:
            if lm[i] is None or not _vis_ok(lm[i]):
                return False
        return True
    except Exception:
        return False

def frontal_pose_ok(lm) -> bool:
    """ไหล่ซ้าย/ขวาอยู่ระดับใกล้กัน (ท่ายืนตรง)"""
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    # y ใกล้กัน (แนวนอนตรง), z ใกล้กัน (หันด้านหน้า)
    dy = abs(ls.y - rs.y)
    dz = abs(getattr(ls, "z", 0.0) - getattr(rs, "z", 0.0))
    return dy < 0.05 and dz < 0.2

def arms_clear_torso(lm) -> bool:
    """ข้อมืออยู่นอกช่วงลำตัว โดยคร่าว ๆ ใช้ช่วง x ไหล่ซ้าย-ขวาเป็นลำตัว"""
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    left, right = sorted([ls.x, rs.x])
    lw, rw = lm[L_WRIST], lm[R_WRIST]
    # ถือว่า ok ถ้าข้อมืออย่างน้อยข้างหนึ่งอยู่นอกช่วงลำตัว
    return (lw.x < left - 0.05) or (rw.x > right + 0.05)

def body_height_norm(lm) -> float:
    """ส่วนสูงเชิงสัมพัทธ์ (head→ankle) ในสเกลพิกัด 0..1 ของภาพ"""
    head_y = lm[NOSE].y
    ankle_y = (lm[L_ANKLE].y + lm[R_ANKLE].y) / 2.0
    # บางที landmark เกินขอบภาพให้ clamp
    h = max(0.0, min(1.5, ankle_y - head_y))
    return h

def _interp(p1, p2, t):
    return (p1[0] + (p2[0]-p1[0])*t, p1[1] + (p2[1]-p1[1])*t)

def chest_line_points(lm, img_w: int, img_h: int, level: float = 0.33) -> Tuple[Optional[Tuple[float, float]], Optional[Tuple[float, float]]]:
    """
    สร้างเส้นระดับอกระหว่างขอบซ้าย/ขวา จากการคาบเกี่ยวเส้นไหล่และสะโพก
    - level 0.0 = ไหล่, 1.0 = สะโพก
    คืนพิกัดพิกเซล (x,y) ของจุดซ้าย/ขวา
    """
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    lh, rh = lm[L_HIP], lm[R_HIP]
    # จุดบนเส้นไหล่และสะโพก
    shoulder_L = (ls.x, ls.y); shoulder_R = (rs.x, rs.y)
    hip_L = (lh.x, lh.y); hip_R = (rh.x, rh.y)
    # สร้างเส้น "อก" โดย lerp ระหว่างเส้นไหล่กับสะโพก
    Lx, Ly = _interp(shoulder_L, hip_L, level)
    Rx, Ry = _interp(shoulder_R, hip_R, level)
    # กลับเป็นพิกเซล
    Lpx = (Lx * img_w, Ly * img_h)
    Rpx = (Rx * img_w, Ry * img_h)
    return Lpx, Rpx
