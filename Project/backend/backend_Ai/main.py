# backend_Ai/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import os
import faiss

from model import base_model, preprocess_fn
from utils import get_embedding_tta

app = FastAPI(title="Body Image Retrieval API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

DATASET_DIR = "dataset"
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# ===== Globals (แยกตาม subset) =====
emb_all = None           # np.ndarray normalized
paths_all = []           # relative paths
index_all = None

emb_men = None
paths_men = []
index_men = None

emb_women = None
paths_women = []
index_women = None


@app.on_event("startup")
async def startup_event():
    print("🔄 Loading dataset embeddings...")
    load_dataset()


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

    # 1) เดินอ่านรูปแบบ recursive → ทำ TTA + preprocess → ได้เวกเตอร์
    vecs_all = []
    paths_all = []

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
                    paths_all.append(rel_path)
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
        print("⚠️  No images found in dataset/")
        return

    emb_all = np.asarray(vecs_all, dtype="float32")

    # 2) Normalize ทั้งชุด (ให้ระยะอยู่ช่วง 0..2 และเทียบด้วย cosine ได้)
    faiss.normalize_L2(emb_all)

    # 3) แยก subset ตาม gender โฟลเดอร์ชั้นแรก
    men_indices = [i for i, p in enumerate(paths_all) if _g_from_rel(p) == "men"]
    women_indices = [i for i, p in enumerate(paths_all) if _g_from_rel(p) == "women"]

    emb_men = emb_all[men_indices] if men_indices else np.zeros((0, emb_all.shape[1]), dtype="float32")
    paths_men = [paths_all[i] for i in men_indices]

    emb_women = emb_all[women_indices] if women_indices else np.zeros((0, emb_all.shape[1]), dtype="float32")
    paths_women = [paths_all[i] for i in women_indices]

    # 4) สร้าง index แยก 3 ชุด
    index_all = _faiss_index_from_matrix(emb_all)
    index_men = _faiss_index_from_matrix(emb_men)
    index_women = _faiss_index_from_matrix(emb_women)

    print(
        f"✅ Loaded: all={len(paths_all)}, men={len(paths_men)}, women={len(paths_women)}, dim={emb_all.shape[1]}"
    )


def _search_and_rerank(q: np.ndarray, X: np.ndarray, paths: list, index: faiss.IndexFlatL2):
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


@app.post("/detect/")
async def detect(
    file: UploadFile = File(...),
    gender: str | None = Form(default=None, description="เลือก men หรือ women; ถ้าเว้นว่าง = ค้นหาทั้งหมด"),
):
    """
    อัปโหลดรูป + (ตัวเลือก) เพศ:
    - gender = 'men'   → ค้นหาเฉพาะ dataset/men/*
    - gender = 'women' → ค้นหาเฉพาะ dataset/women/*
    - ไม่ระบุ          → ค้นหาทั้งหมด
    """
    if emb_all is None or index_all is None:
        raise HTTPException(status_code=500, detail="Index ยังไม่พร้อม กรุณารีสตาร์ทหรือรอโหลด dataset")

    # อ่านรูปและฝั่ง query embedding (TTA + preprocess)
    image_bytes = await file.read()
    q = get_embedding_tta(base_model, image_bytes, preprocess_fn=preprocess_fn).astype("float32").reshape(1, -1)
    faiss.normalize_L2(q)

    # เลือก subset ตาม gender
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
        # ค้นหาทั้งหมด
        if len(paths_all) == 0:
            raise HTTPException(status_code=400, detail="Dataset ว่าง")
        rel_path, dist = _search_and_rerank(q, emb_all, paths_all, index_all)

    # ระบุ gender ของภาพที่แมตช์ (จากโฟลเดอร์)
    g = _g_from_rel(rel_path) if _g_from_rel(rel_path) in ("men", "women") else "unknown"

    return {
        "match_image": rel_path,
        "gender": g,                 # gender ของภาพที่เจอ (จากโฟลเดอร์)
        "distance": dist,            # 0..2 ยิ่งต่ำยิ่งใกล้
        "workout_plan": f"Plan for {rel_path}",
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
