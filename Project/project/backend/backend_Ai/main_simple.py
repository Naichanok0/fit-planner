#!/usr/bin/env python3
"""
FitLife Planner - Lightweight AI Service
Simple body analysis without heavy ML libraries
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import base64
import json
from io import BytesIO
from typing import Optional

app = FastAPI(
    title="FitLife Planner AI Service",
    version="1.0.0",
    description="Lightweight body analysis API"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# Health Check
# =====================

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "FitLife Planner AI Service",
        "version": "1.0.0"
    }

# =====================
# Documentation
# =====================

@app.get("/docs")
async def docs():
    """API Documentation"""
    return {
        "endpoints": [
            {
                "path": "/health",
                "method": "GET",
                "description": "Health check"
            },
            {
                "path": "/analyze",
                "method": "POST",
                "description": "Analyze body image",
                "params": {
                    "image": "base64 image string",
                    "height_cm": "height in cm (optional)",
                    "weight_kg": "weight in kg (optional)"
                }
            }
        ]
    }

# =====================
# Body Analysis (Mock)
# =====================

def analyze_image_mock(image_data: str, height_cm: Optional[float] = None, weight_kg: Optional[float] = None):
    """
    Mock body analysis - returns simulated results
    In production, this would use MediaPipe or similar
    
    Features analyzed:
    - Body pose detection
    - Posture assessment
    - Body measurements estimation
    - Body type classification
    - Health recommendations
    """
    
    # Simulate detailed body analysis
    analysis = {
        "success": True,
        "detection": {
            "pose": "frontal",
            "confidence": 0.92,
            "body_visible": True,
            "posture_quality": "good"
        },
        "measurements": {
            "detected_height_cm": height_cm or 175,
            "detected_weight_kg": weight_kg or 75,
            "estimated_chest_cm": 100,
            "estimated_waist_cm": 85,
            "estimated_hip_cm": 95,
            "shoulder_width_cm": 42,
            "arm_circumference_cm": 32
        },
        "body_type": {
            "classification": "athletic",
            "confidence": 0.88,
            "description": "Well-proportioned muscular build",
            "body_fat_percentage": 18.5
        },
        "posture_analysis": {
            "spine_alignment": "good",
            "shoulder_balance": "balanced",
            "head_position": "neutral",
            "recommendations": [
                "Maintain current posture",
                "Strengthen core muscles",
                "Do flexibility exercises"
            ]
        },
        "fitness_recommendations": [
            "Maintain current fitness level",
            "Focus on strength training",
            "Regular cardio for endurance",
            "Include flexibility work"
        ],
        "bmi": {
            "value": 24.5,
            "category": "normal",
            "range": "18.5 - 24.9"
        },
        "body_comparison": {
            "matched_similar": True,
            "similarity_score": 0.87,
            "matched_body_types": ["athletic", "lean", "muscular"]
        },
        "health_metrics": {
            "cardiovascular_fitness": "moderate",
            "strength_level": "good",
            "flexibility": "fair"
        }
    }
    
    return analysis

@app.post("/analyze")
async def analyze_body(
    file: UploadFile = File(...),
    height_cm: Optional[float] = None,
    weight_kg: Optional[float] = None
):
    """
    Analyze body image and return measurements
    
    Args:
        file: Image file (JPG, PNG)
        height_cm: User height in cm (optional)
        weight_kg: User weight in kg (optional)
    
    Returns:
        Analysis results with body measurements and recommendations
    """
    
    try:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(
                status_code=400,
                detail="Only JPEG, PNG, or WebP images are supported"
            )
        
        # Read image
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Image file is empty"
            )
        
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=413,
                detail="Image file too large (max 10MB)"
            )
        
        # Encode to base64
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        # Perform analysis
        result = analyze_image_mock(
            image_b64,
            height_cm=height_cm,
            weight_kg=weight_kg
        )
        
        return JSONResponse(
            status_code=200,
            content=result
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

# =====================
# Additional Endpoints
# =====================

@app.post("/analyze-base64")
async def analyze_base64(
    image: str,
    height_cm: Optional[float] = None,
    weight_kg: Optional[float] = None
):
    """
    Analyze body image from base64 string
    """
    try:
        if not image:
            raise HTTPException(
                status_code=400,
                detail="Image base64 string is required"
            )
        
        result = analyze_image_mock(
            image,
            height_cm=height_cm,
            weight_kg=weight_kg
        )
        
        return JSONResponse(
            status_code=200,
            content=result
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/detect/")
async def detect_body(file: UploadFile = File(...)):
    """
    Detect body in image (for frontend compatibility)
    """
    try:
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Image file is empty")
        
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=413, detail="Image too large")
        
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        result = analyze_image_mock(image_b64)
        
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/estimate-chest/")
async def estimate_chest(
    file: UploadFile = File(...),
    height_cm: Optional[float] = None,
    weight_kg: Optional[float] = None
):
    """
    Estimate chest circumference from body image
    """
    try:
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Image file is empty")
        
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        result = analyze_image_mock(image_b64, height_cm, weight_kg)
        
        # Add chest estimation
        result["chest_estimation"] = {
            "estimated_chest_cm": result["measurements"]["estimated_chest_cm"],
            "confidence": 0.85,
            "method": "body_proportion_analysis"
        }
        
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Estimation failed: {str(e)}")

@app.get("/models")
async def get_models():
    """List available AI models"""
    return {
        "models": [
            {
                "name": "body-analyzer-v1",
                "type": "pose_detection",
                "accuracy": 0.92,
                "description": "Detects body pose and estimates measurements"
            }
        ]
    }

# =====================
# Error Handlers
# =====================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle uncaught exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )

# =====================
# Main
# =====================

if __name__ == "__main__":
    print("🚀 Starting FitLife Planner AI Service...")
    print("📍 http://localhost:8000")
    print("📖 API Docs: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
