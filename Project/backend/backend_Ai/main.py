# backend_Ai/main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import os
import faiss

from model import base_model
from utils import get_embedding

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dataset_dir = "dataset"
embeddings = []
image_paths = []

@app.on_event("startup")
async def startup_event():
    print("🔄 Loading dataset embeddings...")
    load_dataset()

def load_dataset():
    global embeddings, image_paths, index
    embeddings = []
    image_paths = []

    for file in os.listdir(dataset_dir):
        if file.endswith(".jpg") or file.endswith(".png"):
            with open(os.path.join(dataset_dir, file), "rb") as f:
                emb = get_embedding(base_model, f.read())
                embeddings.append(emb)
                image_paths.append(file)

    embeddings = np.array(embeddings).astype("float32")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    print(f"✅ Loaded {len(embeddings)} embeddings.")

@app.post("/detect/")
async def detect(file: UploadFile = File(...)):
    image_bytes = await file.read()
    query_emb = get_embedding(base_model, image_bytes).astype("float32").reshape(1, -1)

    k = 1
    distances, indices = index.search(query_emb, k)

    result = {
        "match_image": image_paths[indices[0][0]],
        "distance": float(distances[0][0]),
        "workout_plan": f"Plan for {image_paths[indices[0][0]]}"
    }
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
