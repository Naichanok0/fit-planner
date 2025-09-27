from typing import Sequence

# ดัชนีสำคัญของ MediaPipe Pose
L_SHOULDER, R_SHOULDER = 11, 12
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28

def _vis_ok(p, th=0.5):
    return (p is not None) and (getattr(p, "visibility", 1.0) >= th)

def is_full_body_landmarks(lm: Sequence, require_ankles: bool = False) -> bool:
    """
    True = มีข้อมูลพอ:
      - เห็นไหล่ซ้าย/ขวา + สะโพกซ้าย/ขวา ชัด
      - และเห็น 'เข่า' หรือ 'ข้อเท้า' ครบคู่ อย่างน้อยหนึ่งคู่
      - ถ้า require_ankles=True ต้องเห็นข้อเท้าทั้งสองข้าง
    """
    if not all(_vis_ok(lm[i]) for i in (L_SHOULDER, R_SHOULDER, L_HIP, R_HIP)):
        return False

    if require_ankles:
        return _vis_ok(lm[L_ANKLE]) and _vis_ok(lm[R_ANKLE])

    legs_ok = ( _vis_ok(lm[L_KNEE]) and _vis_ok(lm[R_KNEE]) ) or \
              ( _vis_ok(lm[L_ANKLE]) and _vis_ok(lm[R_ANKLE]) )
    return legs_ok

def frontal_pose_ok(lm: Sequence, shoulder_y_delta_th=0.06) -> bool:
    """
    คร่าว ๆ ว่า “ยืนตรงหันหน้า”:
      - ระดับ y ของไหล่ซ้าย/ขวาไม่ต่างกันมาก (ไม่เอียง)
    """
    ls, rs = lm[L_SHOULDER], lm[R_SHOULDER]
    return abs(ls.y - rs.y) <= shoulder_y_delta_th
