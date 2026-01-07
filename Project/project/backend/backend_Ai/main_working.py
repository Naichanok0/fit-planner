from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import json
import os
import random
import uvicorn

app = FastAPI(title="Body Image Retrieval API - Working")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Global variable for metadata
metadata = None

def load_metadata():
    """Load metadata from file"""
    global metadata
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        metadata_path = os.path.join(current_dir, "dataset", "metadata.normalized.json")
        
        print(f"🔍 Looking for metadata at: {metadata_path}")
        
        if os.path.exists(metadata_path):
            print("📂 Metadata file found, loading...")
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            print(f"✅ Successfully loaded {len(metadata)} programs")
            
            # Show available images and goals
            available_data = {}
            for program in metadata[:5]:  # Show first 5 as example
                image = program.get('image', 'unknown')
                goal = program.get('goal', 'unknown')
                if image not in available_data:
                    available_data[image] = []
                available_data[image].append(goal)
            
            print("📋 Sample available data:")
            for img, goals in available_data.items():
                print(f"   {img}: {', '.join(goals)}")
                
            return True
        else:
            print("❌ Metadata file not found!")
            print(f"   Expected: {metadata_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error loading metadata: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Load metadata on startup"""
    print("🚀 Starting AI Body Analysis Server...")
    success = load_metadata()
    if success:
        print("✅ Server ready with full dataset")
    else:
        print("⚠️ Server running without dataset (mock mode)")

@app.get("/")
def read_root():
    return {
        "message": "AI Body Analysis Server - Working Version",
        "status": "running",
        "metadata_loaded": len(metadata) if metadata else 0,
        "mode": "full_data" if metadata else "mock"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "metadata_count": len(metadata) if metadata else 0,
        "sample_images": [p.get('image') for p in (metadata[:3] if metadata else [])],
        "available": bool(metadata)
    }

@app.get("/metadata")
def get_metadata():
    """Return all metadata"""
    if not metadata:
        raise HTTPException(status_code=503, detail="Metadata not loaded")
    
    print(f"📤 Sending {len(metadata)} programs to client")
    return JSONResponse(content=metadata)

@app.post("/detect/")
async def detect_similar_image(
    file: UploadFile = File(...),
    gender: str = Form(default="men")
):
    """Detect similar body type and return matching image"""
    
    try:
        # Read file info
        file_size = len(await file.read())
        await file.seek(0)  # Reset file pointer
        
        print(f"📸 Received image: {file.filename}, size: {file_size} bytes, gender: {gender}")
        
        # For demo purposes, return a known image that exists in metadata
        # In real implementation, this would be AI detection
        
        if metadata and len(metadata) > 0:
            # Find available images for the requested goal
            available_images = []
            for program in metadata:
                img = program.get('image', '')
                goal = program.get('goal', '')
                if goal == 'muscle-gain':  # Default goal
                    available_images.append(img)
            
            if available_images:
                # Use the first available image (or random for variety)
                selected_image = available_images[0]  # or random.choice(available_images)
                
                result = {
                    "match_image": selected_image,
                    "distance": round(random.uniform(0.1, 0.25), 3),
                    "gender": gender.lower(),
                    "confidence": round(random.uniform(0.8, 0.95), 3),
                    "mode": "metadata_based",
                    "available_programs": len([p for p in metadata if p.get('image') == selected_image])
                }
                
                print(f"🎯 Detection result: {result}")
                return JSONResponse(content=result)
        
        # Fallback mock result
        mock_result = {
            "match_image": "10.jpg",
            "distance": 0.15,
            "gender": gender.lower(),
            "confidence": 0.85,
            "mode": "fallback_mock"
        }
        
        print(f"🎯 Fallback result: {mock_result}")
        return JSONResponse(content=mock_result)
        
    except Exception as e:
        print(f"❌ Detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Body Analysis Server...")
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")