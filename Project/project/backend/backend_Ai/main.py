# backend_Ai/main.py
# Clean merge: รวมฟีเจอร์ทั้งสองฝั่ง (JSONResponse/metadata + OpenCV/cv2 + Optional typing)
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
import os
import json
import cv2
from typing import Optional
import base64

# Optional imports - graceful fallback if not installed
try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
    faiss = None

try:
    from model import base_model, preprocess_fn
    HAS_MODEL = True
except ImportError:
    HAS_MODEL = False
    base_model = None
    preprocess_fn = None

try:
    from utils import get_embedding_tta, estimate_chest_circumference_cm
    HAS_UTILS = True
except ImportError:
    HAS_UTILS = False
    get_embedding_tta = None
    estimate_chest_circumference_cm = None

try:
    from detector import BodyDetector
    HAS_DETECTOR = True
except ImportError:
    HAS_DETECTOR = False
    BodyDetector = None

try:
    from validators import (
        is_full_body_landmarks, frontal_pose_ok, arms_clear_torso,
        body_height_norm, chest_line_points, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP
    )
    HAS_VALIDATORS = True
except ImportError:
    HAS_VALIDATORS = False
    # Mock functions as fallback
    def is_full_body_landmarks(lm): return True
    def frontal_pose_ok(lm): return True
    def arms_clear_torso(lm): return True
    def body_height_norm(lm, img_h): return 0.6
    def chest_line_points(lm): return [(0,0), (0,0)]
    L_SHOULDER = R_SHOULDER = L_HIP = R_HIP = 0

app = FastAPI(title="Body Image Retrieval + Chest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ใช้ path แบบ relative จากไฟล์นี้ เพื่อให้รันจากที่ไหนก็เจอ
HERE = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(HERE, "dataset")
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# ===== Globals (แยกตาม subset) =====
emb_all = None           # np.ndarray normalized
paths_all: list[str] = []           # relative paths (ภายใน DATASET_DIR)
index_all = None

emb_men = None
paths_men: list[str] = []
index_men = None

emb_women = None
paths_women: list[str] = []
index_women = None

# Pose detector (ใช้ซ้ำ)
pose_detector = None  # BodyDetector instance


@app.on_event("startup")
async def startup_event():
    global pose_detector
    print("🔄 Loading dataset embeddings...")
    load_dataset()
    
    if HAS_DETECTOR:
        print("🔄 Initializing BodyDetector...")
        try:
            pose_detector = BodyDetector(
                model_complexity=1,
                enable_segmentation=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
                smooth_landmarks=True,
            )
            print("✅ BodyDetector initialized")
        except Exception as e:
            print(f"⚠️  BodyDetector failed: {e}")
            print("⚠️  Continuing without pose detection")
            pose_detector = None
    else:
        print("⚠️  BodyDetector not available - using mock mode")
        pose_detector = None

@app.on_event("shutdown")
async def shutdown_event():
    if pose_detector is not None:
        pose_detector.close()


def _g_from_rel(rel_path: str) -> str:
    """ดึงชื่อโฟลเดอร์ชั้นแรกเป็น 'men' หรือ 'women' (ถ้าไม่ใช่ คืน 'unknown')"""
    parts = os.path.normpath(rel_path).split(os.sep)
    return parts[0].lower() if len(parts) > 1 else "unknown"


def _faiss_index_from_matrix(X: np.ndarray):
    if X is None or X.size == 0:
        # สร้าง index ว่างด้วยมิติ default (1280 สำหรับ MobileNetV2)
        return faiss.IndexFlatL2(1280)
    dim = X.shape[1]
    idx = faiss.IndexFlatL2(dim)
    idx.add(X)
    return idx


def load_dataset():
    global emb_all, paths_all, index_all
    global emb_men, paths_men, index_men
    global emb_women, paths_women, index_women

    vecs_all = []
    paths_all_local = []

    if not os.path.exists(DATASET_DIR):
        os.makedirs(DATASET_DIR, exist_ok=True)

    for root, _, files in os.walk(DATASET_DIR):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in VALID_EXTS:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, DATASET_DIR)  # เก็บเป็น path แบบ relative
                try:
                    with open(full_path, "rb") as f:
                        emb = get_embedding_tta(base_model, f.read(), preprocess_fn=preprocess_fn)
                    vecs_all.append(emb)
                    paths_all_local.append(rel_path)
                except Exception as e:
                    print(f"[skip] {rel_path}: {e}")

    if len(vecs_all) == 0:
        # ไม่มีรูปเลย
        emb_all = np.zeros((0, 1280), dtype="float32")
        index_all = _faiss_index_from_matrix(emb_all)
        emb_men = np.zeros((0, 1280), dtype="float32")
        index_men = _faiss_index_from_matrix(emb_men)
        emb_women = np.zeros((0, 1280), dtype="float32")
        index_women = _faiss_index_from_matrix(emb_women)
        paths_men[:] = []
        paths_women[:] = []
        print("⚠️  No images found in dataset/")
        return

    emb_all = np.asarray(vecs_all, dtype="float32")
    faiss.normalize_L2(emb_all)
    paths_all[:] = paths_all_local

    # แยก subset ตามโฟลเดอร์
    men_indices = [i for i, p in enumerate(paths_all) if _g_from_rel(p) == "men"]
    women_indices = [i for i, p in enumerate(paths_all) if _g_from_rel(p) == "women"]

    emb_men = emb_all[men_indices] if men_indices else np.zeros((0, emb_all.shape[1]), dtype="float32")
    paths_men[:] = [paths_all[i] for i in men_indices]

    emb_women = emb_all[women_indices] if women_indices else np.zeros((0, emb_all.shape[1]), dtype="float32")
    paths_women[:] = [paths_all[i] for i in women_indices]

    # สร้าง index แยก 3 ชุด
    index_all = _faiss_index_from_matrix(emb_all)
    index_men = _faiss_index_from_matrix(emb_men)
    index_women = _faiss_index_from_matrix(emb_women)

    print(f"✅ Loaded: all={len(paths_all)}, men={len(paths_men)}, women={len(paths_women)}, dim={emb_all.shape[1]}")


def _search_and_rerank(q: np.ndarray, X: np.ndarray, paths: list, index):
    """
    ค้นหา top-k ด้วย FAISS แล้ว re-rank ด้วย cosine (dot product บนเวกเตอร์ normalize)
    คืน (rel_path, faiss_distance)
    """
    if X is None or X.size == 0 or len(paths) == 0:
        raise HTTPException(status_code=400, detail="Subset ว่าง: ไม่มีรูปในกลุ่มที่เลือก")

    k = min(20, len(paths))
    D, I = index.search(q, k)  # D: squared L2 (0..2), I: indices (ภายใน subset)

    # map idx -> distance
    dist_map = {int(I[0][i]): float(D[0][i]) for i in range(len(I[0]))}

    # re-rank ด้วย cosine (q, X ถูก normalize แล้ว)
    best_idx = None
    best_cos = -1.0
    for i in range(len(I[0])):
        idx = int(I[0][i])
        v = X[idx:idx+1]
        cos = float((q @ v.T)[0][0])   # -1..1
        if cos > best_cos:
            best_cos = cos
            best_idx = idx

    rel_path = paths[best_idx]
    dist = dist_map.get(best_idx, float(D[0][0]))
    return rel_path, dist

# ------------------------------
# Pose only (วิเคราะห์ท่าทาง)
# ------------------------------
@app.post("/pose/")
async def pose(file: UploadFile = File(...)):
    if pose_detector is None:
        raise HTTPException(status_code=500, detail="Pose detector ยังไม่พร้อม")

    image_bytes = await file.read()
    data = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="อ่านรูปไม่สำเร็จ")

    res = pose_detector.process_bgr(frame)
    if not res.ok or res.landmarks is None:
        return {"ok": False, "message": "ไม่พบ pose ที่ใช้งานได้ (ตรวจไม่ครบจุดสำคัญ)"}

    lm = res.landmarks.landmark
    full_ok = is_full_body_landmarks(lm)
    front_ok = frontal_pose_ok(lm)
    arms_ok = arms_clear_torso(lm)
    h_norm = body_height_norm(lm)

    return {
        "ok": True,
        "shape": res.shape,
        "widths": res.widths,
        "quality": {
            "full_body_ok": full_ok,
            "frontal_ok": front_ok,
            "arms_clear_torso": arms_ok,
            "body_height_norm": h_norm,
        },
    }

# ------------------------------
# Retrieval only (ค้นหารูปคล้าย)
# ------------------------------
@app.post("/detect/")
async def detect(
    file: UploadFile = File(...),
    gender: Optional[str] = Form(default=None, description="men / women; เว้นว่าง = ค้นหาทั้งหมด"),
    goal: Optional[str] = Form(default="muscle-gain", description="goal: muscle-gain / weight-loss / maintenance"),
):
    if emb_all is None or index_all is None:
        raise HTTPException(status_code=500, detail="Index ยังไม่พร้อม กรุณารีสตาร์ทหรือรอโหลด dataset")

    image_bytes = await file.read()
    q = get_embedding_tta(base_model, image_bytes, preprocess_fn=preprocess_fn).astype("float32").reshape(1, -1)
    faiss.normalize_L2(q)

    subset = (gender or "").strip().lower()
    if subset == "men":
        if len(paths_men) == 0:
            raise HTTPException(status_code=400, detail="ไม่มีรูปในกลุ่ม men")
        rel_path, dist = _search_and_rerank(q, emb_men, paths_men, index_men)
    elif subset == "women":
        if len(paths_women) == 0:
            raise HTTPException(status_code=400, detail="ไม่มีรูปในกลุ่ม women")
        rel_path, dist = _search_and_rerank(q, emb_women, paths_women, index_women)
    else:
        if len(paths_all) == 0:
            raise HTTPException(status_code=400, detail="Dataset ว่าง")
        rel_path, dist = _search_and_rerank(q, emb_all, paths_all, index_all)

    g = _g_from_rel(rel_path) if _g_from_rel(rel_path) in ("men", "women") else "unknown"

    # Extract just filename from rel_path (remove folder part)
    filename = os.path.basename(rel_path)
    
    return {
        "match_image": filename,     # ส่งแค่ชื่อไฟล์ (เช่น "24.jpg")
        "gender": g,                 # gender ของภาพที่เจอ (จากโฟลเดอร์)  
        "distance": dist,            # 0..2 ยิ่งต่ำยิ่งใกล้
        "goal": goal,                # ส่ง goal กลับไปด้วย
        "confidence": max(0.0, 1.0 - dist / 2.0),  # แปลง distance เป็น confidence
        "workout_plan": f"Plan for {filename}",
    }

# ------------------------------
# Chest (ภาพเดียว + ส่วนสูง/น้ำหนักที่ผู้ใช้กรอก)
# ------------------------------
@app.post("/chest/")
async def chest_measure(
    file: UploadFile = File(...),
    height_cm: float = Form(...),           # ผู้ใช้กรอก
    weight_kg: float = Form(...),           # ผู้ใช้กรอก
    gender: Optional[str] = Form(None),     # 'men' / 'women' / เว้นว่าง
    chest_level: float = Form(0.33),        # 0.30-0.40 ปรับตามภาพ
    fixed_depth_ratio: Optional[float] = Form(None),  # ถ้าอยากบังคับ ratio เอง
):
    if pose_detector is None:
        raise HTTPException(status_code=500, detail="Pose detector ยังไม่พร้อม")

    image_bytes = await file.read()
    frame = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="อ่านรูปไม่สำเร็จ")

    res = pose_detector.process_bgr(frame)
    if not res.ok or res.landmarks is None:
        return {"ok": False, "message": "ตรวจ landmark ไม่ครบพอสำหรับการวัด (ลองยืนเต็มตัว/ยืนตรง)"}

    h, w = frame.shape[:2]
    out = estimate_chest_circumference_cm(
        lm=res.landmarks.landmark,
        img_w=w, img_h=h,
        height_cm=height_cm,
        weight_kg=weight_kg,
        gender=gender,
        body_height_norm_fn=body_height_norm,
        chest_level=chest_level,
        side_depth_cm=None,
        fixed_depth_ratio=fixed_depth_ratio,
    )
    return out

# ------------------------------
# Chest แบบสองภาพ (หน้าตรง + ด้านข้าง) — แม่นขึ้น
# ------------------------------
@app.post("/chest2/")
async def chest_front_and_side(
    file_front: UploadFile = File(...),
    file_side: UploadFile = File(...),
    height_cm: float = Form(...),
    weight_kg: float = Form(...),
    gender: Optional[str] = Form(None),
    chest_level: float = Form(0.33),
):
    if pose_detector is None:
        raise HTTPException(status_code=500, detail="Pose detector ยังไม่พร้อม")

    # ------ FRONT ------
    b_front = await file_front.read()
    f_front = cv2.imdecode(np.frombuffer(b_front, np.uint8), cv2.IMREAD_COLOR)
    if f_front is None:
        raise HTTPException(status_code=400, detail="อ่านรูป front ไม่สำเร็จ")
    hF, wF = f_front.shape[:2]
    rF = pose_detector.process_bgr(f_front)
    if not rF.ok or rF.landmarks is None:
        return {"ok": False, "message": "front: pose ไม่ครบ"}

    # หาค่า scale และ width_cm จาก front
    tmp = estimate_chest_circumference_cm(
        lm=rF.landmarks.landmark,
        img_w=wF, img_h=hF,
        height_cm=height_cm,
        weight_kg=weight_kg,
        gender=gender,
        body_height_norm_fn=body_height_norm,
        chest_level=chest_level,
        side_depth_cm=None,
    )
    if not tmp.get("ok"):
        return tmp
    cm_per_px = tmp["cm_per_px"]

    # หา y ระดับอกในภาพ front เพื่อใช้กับภาพ side
    Lf, Rf = chest_line_points(rF.landmarks.landmark, wF, hF, level=chest_level)
    chest_y_front = (Lf[1] + Rf[1]) / 2.0 if (Lf and Rf) else hF * (0.2 + 0.6 * chest_level)

    # ------ SIDE ------
    b_side = await file_side.read()
    f_side = cv2.imdecode(np.frombuffer(b_side, np.uint8), cv2.IMREAD_COLOR)
    if f_side is None:
        raise HTTPException(status_code=400, detail="อ่านรูป side ไม่สำเร็จ")
    hS, wS = f_side.shape[:2]
    rS = pose_detector.process_bgr(f_side)
    if not rS.ok or rS.landmarks is None:
        return {"ok": False, "message": "side: pose ไม่ครบ"}

    # ประมาณความลึกทรวงอกจากภาพด้านข้างที่ y ใกล้ chest_y_front (heuristic)
    y_px_side = int(min(max(chest_y_front / hF * hS, 0), hS - 1))
    gray = cv2.cvtColor(f_side, cv2.COLOR_BGR2GRAY)
    row = gray[y_px_side, :]
    row = cv2.GaussianBlur(row, (9, 1), 0)
    thr = np.percentile(row, 40)
    mask = row < thr
    if not mask.any():
        side_depth_cm = None
    else:
        xs = np.where(mask)[0]
        side_width_px = max(0, int(xs.max() - xs.min()))
        side_depth_cm = side_width_px * cm_per_px

    out = estimate_chest_circumference_cm(
        lm=rF.landmarks.landmark,
        img_w=wF, img_h=hF,
        height_cm=height_cm,
        weight_kg=weight_kg,
        gender=gender,
        body_height_norm_fn=body_height_norm,
        chest_level=chest_level,
        side_depth_cm=side_depth_cm,
    )
    out["front_chest_y_px"] = float(chest_y_front)
    out["side_y_px_used"] = float(y_px_side)
    return out


@app.get("/metadata")
def get_metadata():
    # Try metadata.normalized.json first, then fallback to metadata.json
    metadata_paths = [
        os.path.join(DATASET_DIR, "metadata.normalized.json"),
        os.path.join(DATASET_DIR, "metadata.json")
    ]
    
    for metadata_path in metadata_paths:
        if os.path.exists(metadata_path):
            try:
                print(f"📋 Loading metadata from: {metadata_path}")
                with open(metadata_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                print(f"✅ Loaded {len(data)} programs from metadata")
                return JSONResponse(content=data)
            except Exception as e:
                print(f"❌ Error loading {metadata_path}: {e}")
                continue
    
    raise HTTPException(status_code=404, detail="No metadata file found (tried metadata.normalized.json and metadata.json)")


if __name__ == "__main__":
    # เปลี่ยนพอร์ตตามต้องการ (เช่น 8000)
    uvicorn.run(app, host="0.0.0.0", port=8000)
