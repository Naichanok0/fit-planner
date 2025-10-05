import cv2, argparse
from backend_Ai.detector import BodyDetector
from backend_Ai.utils import estimate_chest_circumference_cm
from backend_Ai.validators import body_height_norm

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--height", type=float, required=True, help="ส่วนสูงจริง (cm)")
    p.add_argument("--weight", type=float, required=True, help="น้ำหนัก (kg)")
    p.add_argument("--gender", type=str, choices=["men","women"], default=None, help="เพศ (ออปชัน)")
    p.add_argument("--chest-level", type=float, default=0.33, help="ระดับแนวอก 0..1 จากไหล่ลงสะโพก")
    args = p.parse_args()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("เปิดกล้องไม่สำเร็จ")

    detector = BodyDetector(model_complexity=1, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            res = detector.process_bgr(frame)
            if res.ok and res.landmarks is not None:
                h, w = frame.shape[:2]
                est = estimate_chest_circumference_cm(
                    lm=res.landmarks.landmark,
                    img_w=w, img_h=h,
                    height_cm=args.height,
                    weight_kg=args.weight,
                    gender=args.gender,
                    body_height_norm_fn=body_height_norm,
                    chest_level=args.chest_level,
                )
                chest_txt = f"  CHEST~{est['circumference_cm']:.1f}cm" if est.get("ok") else ""
                label = (f"{res.shape.upper()}  "
                         f"S:{res.widths['shoulder_width']:.3f}  "
                         f"H:{res.widths['hip_width']:.3f}  "
                         f"W:{res.widths['waist_width']:.3f}{chest_txt}")
                detector.draw_overlays(frame, res.landmarks, label)
            else:
                detector.draw_overlays(frame, None, "No pose detected")

            cv2.imshow("Body Detect (press Q to quit)", frame)
            if cv2.waitKey(1) & 0xFF in (ord('q'), 27):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()

if __name__ == "__main__":
    main()
