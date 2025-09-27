import cv2
from backend_Ai.detector import BodyDetector

def main():
    cap = cv2.VideoCapture(0)  # 0 = กล้องหลัก
    if not cap.isOpened():
        raise RuntimeError("เปิดกล้องไม่สำเร็จ")

    detector = BodyDetector(model_complexity=1, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            result = detector.process_bgr(frame)

            if result.ok:
                sw = result.widths["shoulder_width"]
                hw = result.widths["hip_width"]
                ww = result.widths["waist_width"]
                label = f"{result.shape.upper()}  S:{sw:.3f}  H:{hw:.3f}  W:{ww:.3f}"
                detector.draw_overlays(frame, result.landmarks, label)
            else:
                detector.draw_overlays(frame, None, "No pose detected")

            cv2.imshow("Body Detect (press Q to quit)", frame)
            if cv2.waitKey(1) & 0xFF in (ord('q'), 27):  # กด q หรือ ESC เพื่อปิด
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()

if __name__ == "__main__":
    main()
