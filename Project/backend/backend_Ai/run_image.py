import cv2
import glob
import os
from backend_Ai.detector import BodyDetector

def run_on_image(path: str, show: bool = True, save: bool = False, out_dir: str = "outputs"):
    img = cv2.imread(path)
    if img is None:
        print(f"[WARN] อ่านรูปไม่ได้: {path}")
        return

    detector = BodyDetector()
    res = detector.process_bgr(img)

    if res.ok:
        sw = res.widths["shoulder_width"]
        hw = res.widths["hip_width"]
        ww = res.widths["waist_width"]
        label = f"{res.shape.upper()}  S:{sw:.3f} H:{hw:.3f} W:{ww:.3f}"
        detector.draw_overlays(img, res.landmarks, label)
    else:
        detector.draw_overlays(img, None, "No pose detected")

    if save:
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, os.path.basename(path))
        cv2.imwrite(out_path, img)
        print(f"[OK] บันทึก: {out_path}")

    if show:
        cv2.imshow("Result", img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    detector.close()

def main():
    # เปลี่ยนเป็น path รูปเดี่ยว หรือโฟลเดอร์ก็ได้
    target = "samples"  # โฟลเดอร์ที่มีรูป .jpg/.png
    if os.path.isdir(target):
        files = sorted(glob.glob(os.path.join(target, "*.jpg")) + glob.glob(os.path.join(target, "*.png")))
        for f in files:
            run_on_image(f, show=True, save=True)
    else:
        run_on_image(target, show=True, save=True)

if __name__ == "__main__":
    main()
