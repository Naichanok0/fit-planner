from dataclasses import dataclass
from typing import Optional, Dict, Any

import cv2
import mediapipe as mp

from .utils import extract_body_widths, classify_shape
from .validators import is_full_body_landmarks, frontal_pose_ok

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_style = mp.solutions.drawing_styles

@dataclass
class PoseResult:
    ok: bool
    widths: Dict[str, float]
    shape: str
    landmarks: Optional[Any]  # pose_landmarks

class BodyDetector:
    def __init__(
        self,
        model_complexity: int = 1,
        enable_segmentation: bool = False,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        smooth_landmarks: bool = True,
    ):
        # สร้างตัวตรวจจับ Pose ของ MediaPipe
        self.pose = mp_pose.Pose(
            model_complexity=model_complexity,
            enable_segmentation=enable_segmentation,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            smooth_landmarks=smooth_landmarks,
        )

    def process_bgr(self, frame_bgr) -> PoseResult:
        # MediaPipe ต้องการ RGB
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        if not results.pose_landmarks:
            return PoseResult(False, {"shoulder_width": 0.0, "hip_width": 0.0, "waist_width": 0.0}, "unknown", None)

        lm = results.pose_landmarks.landmark

        # ตรวจคุณภาพเฟรม: เต็มตัว/ยืนตรงไหม
        full_ok = is_full_body_landmarks(lm, require_ankles=False)
        front_ok = frontal_pose_ok(lm)

        widths = extract_body_widths(lm)
        shape = classify_shape(**widths)

        tag = []
        if not full_ok: tag.append("not-full-body")
        if not front_ok: tag.append("not-frontal")
        label_shape = shape if not tag else f"{shape} ({' | '.join(tag)})"

        return PoseResult(True, widths, label_shape, results.pose_landmarks)

    @staticmethod
    def draw_overlays(frame_bgr, pose_landmarks, text: str = ""):
        # วาดโครงร่างร่างกาย + ข้อความสรุป
        if pose_landmarks is not None:
            mp_drawing.draw_landmarks(
                frame_bgr,
                pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_style.get_default_pose_landmarks_style(),
            )
        if text:
            # ขอบดำ + ตัวอักษรขาวให้อ่านง่าย
            cv2.putText(frame_bgr, text, (18, 36),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 4, cv2.LINE_AA)
            cv2.putText(frame_bgr, text, (18, 36),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)

    def close(self):
        # ปิดทรัพยากร MediaPipe
        self.pose.close()
