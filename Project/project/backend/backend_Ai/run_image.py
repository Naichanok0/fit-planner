import cv2, glob, os, argparse
from backend_Ai.detector import BodyDetector
from backend_Ai.utils import estimate_chest_circumference_cm
from backend_Ai.validators import body_height_norm

def run_on_image(path: str, height_cm: float, weight_kg: float, gender: str|None, chest_level: float,
                 show: bool = True, save: bool = False, out_dir: str = "outputs"):
    img = cv2.imread(path)
    if img is None:
        print(f"[WARN] อ่านรูปไม่ได้: {path}")
        return

    detector = BodyDetector()
    res = detector.process_bgr(img)

    if res.ok and res.landmarks is not None:
        h, w = img.shape[:2]
        est = estimate_chest_circumference_cm(
            lm=res.landmarks.landmark, img_w=w, img_h=h,
            height_cm=height_cm, weight_kg=weight_kg, gender=gender,
            body_height_norm_fn=body_height_norm, chest_level=chest_level
        )
        label = (f"{res.shape.upper()}  S:{res.widths['shoulder_width']:.3f} "
                 f"H:{res.widths['hip_width']:.3f} W:{res.widths['waist_width']:.3f}")
        if est.get("ok"):
            label += f"  CHEST~{est['circumference_cm']:.1f}cm"
            print(f"[OK] {os.path.basename(path)} → Chest ≈ {est['circumference_cm']:.1f} cm "
                  f"(width {est['width_cm']:.1f} / depth {est['depth_cm']:.1f} cm, {est['depth_source']})")
        else:
            print(f"[WARN] วัดรอบอกไม่ได้: {est.get('reason')}")

        detector.draw_overlays(img, res.landmarks, label)
    else:
        detector.draw_overlays(img, None, "No pose detected")

    if save:
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, os.path.basename(path))
        cv2.imwrite(out_path, img)

    if show:
        cv2.imshow("Result", img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    detector.close()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target", help="ไฟล์ภาพเดี่ยว หรือโฟลเดอร์ที่มีภาพ")
    ap.add_argument("--height", type=float, required=True, help="ส่วนสูงจริง (cm)")
    ap.add_argument("--weight", type=float, required=True, help="น้ำหนัก (kg)")
    ap.add_argument("--gender", type=str, choices=["men","women"], default=None)
    ap.add_argument("--chest-level", type=float, default=0.33)
    ap.add_argument("--save", action="store_true")
    args = ap.parse_args()

    if os.path.isdir(args.target):
        files = sorted(glob.glob(os.path.join(args.target, "*.jpg")) +
                       glob.glob(os.path.join(args.target, "*.png")) +
                       glob.glob(os.path.join(args.target, "*.jpeg")))
        for f in files:
            run_on_image(f, args.height, args.weight, args.gender, args.chest_level, show=True, save=args.save)
    else:
        run_on_image(args.target, args.height, args.weight, args.gender, args.chest_level, show=True, save=args.save)

if __name__ == "__main__":
    main()
