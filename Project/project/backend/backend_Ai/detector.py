
# backend_Ai/detector.py
from dataclasses import dataclass
from typing import Optional, Dict
import mediapipe as mp
import cv2
from utils import extract_body_widths

@dataclass
class PoseResult:
    ok: bool
    landmarks: Optional[object]
    shape: Optional[str] = None
    widths: Optional[Dict[str, float]] = None

class BodyDetector:
    def __init__(self, model_complexity=1, enable_segmentation=False,
                 min_detection_confidence=0.5, min_tracking_confidence=0.5,
                 smooth_landmarks=True):
        self._mp = mp.solutions.pose
        self._pose = self._mp.Pose(
            model_complexity=model_complexity,
            enable_segmentation=enable_segmentation,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            smooth_landmarks=smooth_landmarks,
        )

    def process_bgr(self, frame_bgr):
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        res = self._pose.process(frame_rgb)
        if res.pose_landmarks is None:
            return PoseResult(ok=False, landmarks=None)
        lm = res.pose_landmarks
        widths = extract_body_widths(lm.landmark)
        # ไม่คำนวณ shape แบบละเอียดในตัวอย่างนี้ (คงไว้ให้ภายนอกตัดสิน)
        return PoseResult(ok=True, landmarks=lm, shape=None, widths=widths)

    def close(self):
        if hasattr(self, "_pose") and self._pose is not None:
            self._pose.close()
