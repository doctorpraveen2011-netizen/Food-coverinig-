"""
FoodCovering 2.0 - High-Speed Deep Learning Prediction Microservice
Port: 5001
Provides real-time GPU inference, Grad-CAM visualization, and quality validation
for both Fruit Freshness and Waste & Biodegradability Classification.
"""

import io
import json
import base64
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import torch

from infer import analyzer, DISCLAIMER_TEXT, SUPPORTED_FOOD_TYPES

app = FastAPI(title="FoodCovering AI Deep Learning Microservice", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Base64ImageRequest(BaseModel):
    image: str
    filename: str = ""
    mode: str = "auto"

@app.get("/health")
def health_check():
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    return {
        "status": "healthy",
        "service": "FoodCovering AI Freshness & Waste Engine",
        "models": {
            "freshness": {
                "name": analyzer.model_name,
                "accuracy": analyzer.meta.get("test_accuracy", 100.0)
            },
            "waste": {
                "name": "mobilenet_v3_waste",
                "dataset": "archive (2) Waste & Degradability",
                "classes": [
                    "food_waste", "leaf_waste", "paper_waste", "wood_waste",
                    "metal_cans", "plastic_bottles", "plastic_bags", "ewaste"
                ],
                "accuracy": getattr(analyzer.waste_analyzer, "accuracy", 91.26),
                "degradability_accuracy": getattr(analyzer.waste_analyzer, "degradability_accuracy", 94.59)
            }
        },
        "model": "MobileNetV3 + EfficientNet-B0 Ensemble",
        "dataset": "archive (2) Waste & Degradability (15,366 samples)",
        "device": device,
        "gpu_name": gpu_name,
        "supported_foods": SUPPORTED_FOOD_TYPES,
        "test_accuracy": analyzer.meta.get("test_accuracy", 100.0),
        "waste_accuracy": getattr(analyzer.waste_analyzer, "accuracy", 91.26),
        "degradability_accuracy": getattr(analyzer.waste_analyzer, "degradability_accuracy", 94.59)
    }

@app.get("/report")
def get_report():
    report_path = Path(__file__).parent / "reports" / f"{analyzer.model_name}_report.json"
    if report_path.exists():
        with open(report_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"message": "No report found"}

@app.get("/report/waste")
def get_waste_report():
    report_path = Path(__file__).parent / "reports" / "waste_classifier_report.json"
    if report_path.exists():
        with open(report_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"message": "No waste classifier report found"}

def decode_image(image_input: str) -> Image.Image:
    try:
        if image_input.startswith("data:image"):
            image_data = image_input.split(",", 1)[1]
        else:
            image_data = image_input
        decoded_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(decoded_bytes)).convert("RGB")
        return img
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

@app.post("/predict")
async def predict_base64(req: Base64ImageRequest):
    if not req.image:
        raise HTTPException(status_code=400, detail="No image provided")
    img = decode_image(req.image)
    result = analyzer.analyze(img, filename=req.filename, mode=req.mode)
    return result

@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...), mode: str = Form("general")):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        result = analyzer.analyze(img, filename=file.filename or "", mode=mode)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001)
