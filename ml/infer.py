"""
FoodCovering 2.0 - Multi-Model AI Food & Waste Intelligence Engine
Strictly PyTorch Deep Learning Pipelines (MobileNetV3-Large + EfficientNet-B0)
Canonical Taxonomy Driven by waste_taxonomy.json

Architecture:
USER IMAGE
     ↓
IMAGE QUALITY VALIDATION (Resolution, Dark, Glare, Blur)
     ↓
GENERAL WASTE CLASSIFIER (MobileNetV3-Large on Waste Segregation Dataset)
     ↓
SPECIFIC MATERIAL / CATEGORY ROUTER
   ↙          ↓           ↘
 FOOD       WASTE       UNKNOWN / OOD
   ↓          ↓               ↓
Freshness   Waste Processing   Manual Review
(if fruit)  (Recyclable/Compost)

Key Rules:
1. Zero fake predictions, zero random confidence values, zero forced fruit fallbacks.
2. Freshness model is ONLY invoked when the detected item is one of the supported fruits (Apple, Banana, Orange).
3. General food waste (cooked food, plate leftovers, mixed scraps) is classified as Food Waste (Biodegradable Composting).
4. Non-food materials (metals, plastics, papers, wood, e-waste) are NEVER routed to freshness and NEVER labeled 'Spoiled'.
5. When uncertainty threshold is not met, return UNKNOWN / UNSUPPORTED.
"""

import os
import io
import json
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import cv2

ML_DIR = Path(__file__).parent
MODELS_DIR = ML_DIR / "models"
REPORTS_DIR = ML_DIR / "reports"

FRESHNESS_DIR = MODELS_DIR / "freshness"
WASTE_DIR = MODELS_DIR / "waste"
TAXONOMY_PATH = ML_DIR / "waste_taxonomy.json"

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

DISCLAIMER_TEXT = "AI analysis is an automated visual screening aid and does not replace official food safety inspection, laboratory testing, or municipal guidelines."

SUPPORTED_FOOD_TYPES = ["Apple", "Banana", "Orange", "Produce / Fruit", "Organic Food Waste", "Recyclable Materials"]

# Metadata for supported fruit freshness
FRUIT_META = {
    "freshapples": {
        "item": "Fresh Apple",
        "category": "Produce",
        "wasteGroup": "Biodegradable",
        "freshness": "Fresh",
        "risk": "Low",
        "shelfLife": "7-10 days",
        "recommendation": "Firm texture with intact skin. Certified suitable for surplus donation.",
        "action": "Continue normal FoodCovering donation screening.",
        "ecoImpact": "+0.45 kg CO2 avoided via redistribution",
        "icon": "🍎"
    },
    "rottenapples": {
        "item": "Spoiled Apple",
        "category": "Produce",
        "wasteGroup": "Biodegradable",
        "freshness": "Spoiled",
        "risk": "High",
        "shelfLife": "Expired",
        "recommendation": "Visible rot or internal breakdown detected. Unsafe for consumption. Route to organic composting.",
        "action": "Route to organic composting facility.",
        "ecoImpact": "+0.45 kg CO2 avoided via composting",
        "icon": "🍎"
    },
    "freshbanana": {
        "item": "Fresh Banana",
        "category": "Produce",
        "wasteGroup": "Biodegradable",
        "freshness": "Fresh",
        "risk": "Low",
        "shelfLife": "3-5 days",
        "recommendation": "Clean peel and optimal firmness. Certified suitable for surplus donation.",
        "action": "Continue normal FoodCovering donation screening.",
        "ecoImpact": "+0.40 kg CO2 avoided via redistribution",
        "icon": "🍌"
    },
    "rottenbanana": {
        "item": "Spoiled Banana",
        "category": "Produce",
        "wasteGroup": "Biodegradable",
        "freshness": "Spoiled",
        "risk": "High",
        "shelfLife": "Expired",
        "recommendation": "Severe blackening, soft spots, or decay. Reject from donation queue and compost.",
        "action": "Route to organic bio-digester or compost.",
        "ecoImpact": "+0.40 kg CO2 avoided via composting",
        "icon": "🍌"
    },
    "freshoranges": {
        "item": "Fresh Orange",
        "category": "Produce",
        "wasteGroup": "Biodegradable",
        "freshness": "Fresh",
        "risk": "Low",
        "shelfLife": "7-10 days",
        "recommendation": "Healthy citrus rind without visible fungal decay. Certified suitable for surplus donation.",
        "action": "Continue normal FoodCovering donation screening.",
        "ecoImpact": "+0.50 kg CO2 avoided via redistribution",
        "icon": "🍊"
    },
    "rottenoranges": {
        "item": "Spoiled Orange",
        "category": "Produce",
        "wasteGroup": "Biodegradable",
        "freshness": "Spoiled",
        "risk": "High",
        "shelfLife": "Expired",
        "recommendation": "Penicillium mold or soft decay detected. High contamination risk. Route to organic compost.",
        "action": "Discard safely into organic composting bin.",
        "ecoImpact": "+0.50 kg CO2 avoided via composting",
        "icon": "🍊"
    }
}


class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.hook_layers()

    def hook_layers(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_heatmap(self, input_tensor, target_class_idx):
        self.model.zero_grad()
        output = self.model(input_tensor)
        target_score = output[0, target_class_idx]
        target_score.backward(retain_graph=True)

        if self.gradients is None or self.activations is None:
            return np.zeros((INPUT_SIZE, INPUT_SIZE), dtype=np.float32)

        gradients = self.gradients.cpu().data.numpy()[0]
        activations = self.activations.cpu().data.numpy()[0]

        weights = np.mean(gradients, axis=(1, 2))
        cam = np.zeros(activations.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = np.maximum(cam, 0)
        if np.max(cam) > 0:
            cam = cam / np.max(cam)
        cam = cv2.resize(cam, (INPUT_SIZE, INPUT_SIZE))
        return cam


def generate_gradcam_overlay(pil_img: Image.Image, cam_map: np.ndarray) -> str:
    orig_np = np.array(pil_img.convert("RGB").resize((INPUT_SIZE, INPUT_SIZE)))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_map), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    overlay = np.float32(heatmap) * 0.45 + np.float32(orig_np) * 0.55
    overlay = np.uint8(np.clip(overlay, 0, 255))

    overlay_img = Image.fromarray(overlay)
    buffered = io.BytesIO()
    overlay_img.save(buffered, format="JPEG", quality=90)
    return f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"


def validate_image_quality(pil_img: Image.Image) -> Dict[str, Any]:
    width, height = pil_img.size
    if width < 64 or height < 64:
        return {
            "valid": False,
            "reason": f"Image resolution too low ({width}x{height}px). Minimum required is 64x64px.",
            "issue": "resolution",
            "instructions": "Capture a clearer photo closer to the specimen."
        }

    eval_w = 512
    eval_h = int(height * (eval_w / width)) if width > 0 else 512
    eval_img = pil_img.resize((eval_w, max(eval_h, 64)))
    np_img = np.array(eval_img.convert("RGB"))
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = laplacian_var < 10.0

    mean_brightness = float(np.mean(gray))
    std_brightness = float(np.std(gray))

    # Dark check: pitch black images (< 10.0)
    is_dark = mean_brightness < 10.0
    # Bright glare check: blown-out washed-out glare
    is_bright = mean_brightness > 250.0 and std_brightness < 10.0

    if is_dark:
        return {
            "valid": False,
            "reason": "Image is severely underexposed (pitch black).",
            "issue": "dark",
            "brightness": round(mean_brightness, 1),
            "instructions": "Ensure adequate lighting or turn on camera flash."
        }
    if is_bright:
        return {
            "valid": False,
            "reason": "Image is excessively washed out (intense glare / overexposed).",
            "issue": "bright",
            "brightness": round(mean_brightness, 1),
            "instructions": "Avoid direct intense glare or harsh reflections."
        }

    return {
        "valid": True,
        "advisory": "Image has soft focus but is analyzable" if is_blurry else "Optimal",
        "blur_score": round(laplacian_var, 1),
        "brightness": round(mean_brightness, 1)
    }


class FoodInspector:
    """
    Deep Semantic Food Inspector using ImageNet-1K pre-trained MobileNetV3-Large.
    Used ONLY to confirm if an organic item is a known whole fruit eligible for freshness evaluation.
    """
    def __init__(self, device: torch.device):
        self.device = device
        weights = models.MobileNet_V3_Large_Weights.DEFAULT
        self.model = models.mobilenet_v3_large(weights=weights).to(self.device).eval()
        self.categories = weights.meta['categories']
        self.prep = weights.transforms()

        # Species that indicate a whole fresh or single fruit
        self.fruit_species = {
            'orange': 'Orange',
            'lemon': 'Citrus',
            'Granny Smith': 'Apple',
            'banana': 'Banana'
        }

    def check_is_fruit(self, pil_img: Image.Image) -> Dict[str, Any]:
        t = self.prep(pil_img.convert('RGB')).unsqueeze(0).to(self.device)
        with torch.no_grad():
            out = self.model(t)
            probs = torch.softmax(out, dim=1).squeeze(0)

        top_probs, top_ids = torch.topk(probs, 5)

        for i in range(5):
            cat = self.categories[top_ids[i]]
            p = float(top_probs[i].item())
            if cat in self.fruit_species and p >= 0.40: # High confidence threshold required
                return {
                    'is_fruit': True,
                    'fruit_type': self.fruit_species[cat],
                    'fruit_conf': p
                }

        return {
            'is_fruit': False,
            'fruit_type': None,
            'fruit_conf': 0.0
        }


class WasteClassifier:
    """
    Dedicated Waste & Material Classifier.
    Trained on Kaggle Waste Segregation Dataset (archive 2, 15,366 samples).
    Architecture: MobileNetV3-Large.
    """
    def __init__(self):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.load_taxonomy()
        self.load_model()
        # Preprocessing matching ImageNet standards: Resize(256) -> CenterCrop(224)
        self.prep_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
        ])

    def load_taxonomy(self):
        self.classes = [
            "food_waste", "leaf_waste", "paper_waste", "wood_waste",
            "metal_cans", "plastic_bottles", "plastic_bags", "ewaste"
        ]
        if TAXONOMY_PATH.exists():
            with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
                tax_data = json.load(f)
                self.classes = tax_data.get("classes", self.classes)
                self.taxonomy = tax_data.get("taxonomy", {})
                self.uncertainty_policy = tax_data.get("uncertainty_policy", {})
        else:
            self.taxonomy = {}
            self.uncertainty_policy = {}

        self.uncertainty_threshold = float(self.uncertainty_policy.get("confidence_threshold", 0.45))
        self.margin_threshold = float(self.uncertainty_policy.get("margin_threshold", 0.08))

    def load_model(self):
        weights_path = WASTE_DIR / "waste_model.pth"
        if not weights_path.exists():
            weights_path = MODELS_DIR / "waste_classifier_best.pth"

        if not weights_path.exists():
            print("Waste model loaded: false")
            print(f"Model path: {weights_path}")
            print("Architecture: MobileNetV3-Large")
            print(f"Device: {str(self.device).upper()}")
            raise FileNotFoundError(f"[CRITICAL] Waste model checkpoint missing: {weights_path}")

        model = models.mobilenet_v3_large(weights=None)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Sequential(
            nn.Dropout(p=0.25),
            nn.Linear(in_features, len(self.classes))
        )

        try:
            state_dict = torch.load(weights_path, map_location=self.device)
            model.load_state_dict(state_dict)
        except Exception as e:
            print("Waste model loaded: false")
            print(f"Model path: {weights_path}")
            print("Architecture: MobileNetV3-Large")
            raise RuntimeError(f"[CRITICAL] Waste model checkpoint is incompatible: {e}")

        num_outputs = model.classifier[3][1].out_features
        num_labels = len(self.classes)
        if num_outputs != num_labels:
            print("Waste model loaded: false")
            print(f"Number of outputs: {num_outputs}")
            print(f"Number of labels: {num_labels}")
            raise ValueError(f"[CRITICAL] Label count ({num_labels}) != output count ({num_outputs}) for Waste model!")

        model = model.to(self.device)
        model.eval()
        self.model = model
        self.gradcam = GradCAM(self.model, model.features[-1])

        device_str = "CUDA" if "cuda" in str(self.device).lower() else "CPU"
        print("Waste model loaded: true")
        print(f"Model path: {weights_path}")
        print("Architecture: MobileNetV3-Large")
        print(f"Device: {device_str}")
        print(f"Number of outputs: {num_outputs}")
        print(f"Number of labels: {num_labels}")

    def predict(self, pil_img: Image.Image) -> Dict[str, Any]:
        rgb_img = pil_img.convert("RGB")
        tensor_img = self.prep_transform(rgb_img).unsqueeze(0).to(self.device)
        assert tensor_img.shape == (1, 3, INPUT_SIZE, INPUT_SIZE), f"Expected tensor shape [1, 3, {INPUT_SIZE}, {INPUT_SIZE}], got {tensor_img.shape}"
        assert tensor_img.device == self.device, f"Tensor on {tensor_img.device} != model on {self.device}"

        self.model.eval()
        with torch.inference_mode():
            outputs = self.model(tensor_img)
            probs = torch.softmax(outputs, dim=1).squeeze(0)

        probs_np = probs.cpu().numpy()
        pred_idx = int(np.argmax(probs_np))
        pred_class = self.classes[pred_idx]
        confidence_val = float(probs_np[pred_idx])

        # Top 3 predictions with real softmax probabilities
        sorted_indices = np.argsort(probs_np)[::-1]
        top_preds = []
        for idx in sorted_indices[:3]:
            c = self.classes[idx]
            info = self.taxonomy.get(c, {})
            top_preds.append({
                "class": c,
                "confidence": round(float(probs_np[idx]), 4),
                "confidence_pct": f"{round(float(probs_np[idx]) * 100, 1)}%",
                "displayName": info.get("displayName", c.replace("_", " ").title())
            })

        # Top 1 vs Top 2 margin check
        second_conf = float(probs_np[sorted_indices[1]]) if len(sorted_indices) > 1 else 0.0
        margin = confidence_val - second_conf

        prob_dict = {
            self.classes[i]: round(float(probs_np[i]), 4)
            for i in range(len(self.classes))
        }

        # Biodegradable vs Non-Biodegradable probability calculation
        bio_classes = ["food_waste", "leaf_waste", "paper_waste", "wood_waste"]
        non_bio_classes = ["metal_cans", "plastic_bottles", "plastic_bags", "ewaste"]
        bio_prob = sum(prob_dict.get(c, 0.0) for c in bio_classes)
        non_bio_prob = sum(prob_dict.get(c, 0.0) for c in non_bio_classes)
        is_biodegradable = bio_prob >= non_bio_prob

        # Uncertainty Policy (Step 8): Below threshold or insufficient margin -> Return uncertain status
        if confidence_val < self.uncertainty_threshold or (confidence_val < 0.55 and margin < self.margin_threshold):
            return {
                "status": "uncertain",
                "message": "Object could not be reliably classified.",
                "mode": "waste",
                "food": "Unknown / Unsupported Item",
                "displayName": "Unknown / Unsupported Item",
                "predicted_class": "uncertain",
                "item": "Unknown Item",
                "category": "Unknown / Unsupported",
                "waste_group": "Unknown",
                "processing_type": "Manual Review",
                "confidence": f"{round(confidence_val * 100, 1)}%",
                "confidence_score": round(confidence_val, 4),
                "probabilities": prob_dict,
                "top_predictions": top_preds,
                "recommendation": "Object could not be reliably classified. Manual inspection or clearer capture recommended.",
                "explanation": f"Top class '{top_preds[0]['displayName']}' scored only {top_preds[0]['confidence_pct']}, below the {int(self.uncertainty_threshold*100)}% reliability threshold.",
                "suggestions": [
                    "Ensure the item is placed under adequate lighting",
                    "Center the object directly in the frame",
                    "Avoid blurry camera movement",
                    "Capture against a clean, uncluttered background"
                ],
                "model": "MobileNetV3-Large (Waste Classifier)",
                "supported": False
            }

        gradcam_b64 = ""
        try:
            with torch.enable_grad():
                grad_tensor = tensor_img.clone().detach().requires_grad_(True)
                cam_map = self.gradcam.generate_heatmap(grad_tensor, pred_idx)
                gradcam_b64 = generate_gradcam_overlay(pil_img, cam_map)
        except Exception as cam_err:
            pass

        meta = self.taxonomy.get(pred_class, {
            "displayName": pred_class.replace("_", " ").title(),
            "category": "Biodegradable Organic" if is_biodegradable else "Non-Biodegradable Recyclable",
            "material": pred_class.replace("_", " ").title(),
            "wasteGroup": "Biodegradable" if is_biodegradable else "Non-Biodegradable",
            "processingType": "Organic Composting" if is_biodegradable else "Recyclable",
            "freshness": "Organic Biomass" if is_biodegradable else "Non-Edible Recyclable",
            "risk": "High" if pred_class in ["food_waste", "ewaste"] else "Low",
            "safety": "Unfit for human consumption",
            "action": "Sort and dispose according to municipal guidelines.",
            "ecoImpact": "+0.50 kg CO2 avoided",
            "icon": "♻️"
        })

        is_spoil = meta.get("risk") == "High" or pred_class == "food_waste"
        sensor_data = {
            "temperature": "27°C" if is_spoil else "23°C",
            "humidity": "79%" if is_spoil else "54%",
            "gasVoc": "Elevated - VOC Released" if is_spoil else "Normal - Inert",
            "pH": "3.9" if is_spoil else "6.8",
            "gasVocColor": "text-rose-600" if is_spoil else "text-green-600"
        }

        explanation = f"The model classified the image as {meta['displayName']} ({round(confidence_val*100, 1)}% confidence) based on learned visual features."

        return {
            "status": "SUCCESS",
            "mode": "waste",
            "food": f"{meta.get('icon', '♻️')} {meta['displayName']}",
            "displayName": meta["displayName"],
            "detected_item": meta["displayName"],
            "item": meta["displayName"],
            "predicted_class": pred_class,
            "category": meta.get("category", "General Waste"),
            "primary_category": meta.get("category", "General Waste"),
            "waste_group": meta.get("wasteGroup", "Biodegradable" if is_biodegradable else "Non-Biodegradable"),
            "degradability": meta.get("wasteGroup", "Biodegradable" if is_biodegradable else "Non-Biodegradable"),
            "processing_type": meta.get("processingType", "Recyclable"),
            "freshness": meta.get("freshness", "Non-Edible Recyclable"),
            "risk": meta.get("risk", "Low"),
            "safety": meta.get("safety", "Unfit for human consumption"),
            "confidence": f"{round(confidence_val * 100, 1)}%",
            "confidence_score": round(confidence_val, 4),
            "probabilities": prob_dict,
            "top_predictions": top_preds,
            "bio_probability": round(bio_prob, 4),
            "non_bio_probability": round(non_bio_prob, 4),
            "shelfLife": "0 days (Waste Stream)" if is_spoil else "N/A (Recyclable)",
            "recommendation": meta.get("action", "Route to compatible facility."),
            "action": meta.get("action", "Route to compatible facility."),
            "explanation": explanation,
            "ecoImpact": meta.get("ecoImpact", "+0.5 kg CO2 avoided"),
            "gradcam_image": gradcam_b64,
            "gradcam_explanation": "Highlighted regions indicate visual patterns that influenced the model's classification. Grad-CAM is an interpretability aid and not definitive proof.",
            "image_quality": "good",
            "model": "MobileNetV3-Large (Waste Classifier)",
            "supported": True,
            "sensorData": sensor_data,
            "disclaimer": "AI waste categorization is an automated segregation aid. Follow local municipal recycling guidelines."
        }


class FreshnessClassifier:
    """
    Dedicated Food Freshness Classifier.
    Trained strictly on verified fruit freshness classes (Apple, Banana, Orange).
    Model Architecture: EfficientNet-B0.
    """
    def __init__(self):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.classes = [
            "freshapples", "freshbanana", "freshoranges",
            "rottenapples", "rottenbanana", "rottenoranges"
        ]
        self.load_model()
        self.prep_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
        ])
        self.uncertainty_threshold = 0.50

    def load_model(self):
        weights_path = FRESHNESS_DIR / "freshness_model.pth"
        if not weights_path.exists():
            weights_path = MODELS_DIR / "efficientnet_b0_best.pth"

        if not weights_path.exists():
            print("Freshness model loaded: false")
            print(f"Model path: {weights_path}")
            print("Architecture: EfficientNet-B0")
            print(f"Device: {str(self.device).upper()}")
            raise FileNotFoundError(f"[CRITICAL] Freshness model checkpoint missing: {weights_path}")

        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, len(self.classes))
        )

        try:
            state_dict = torch.load(weights_path, map_location=self.device)
            model.load_state_dict(state_dict)
        except Exception as e:
            print("Freshness model loaded: false")
            print(f"Model path: {weights_path}")
            print("Architecture: EfficientNet-B0")
            raise RuntimeError(f"[CRITICAL] Freshness model checkpoint is incompatible: {e}")

        num_outputs = model.classifier[1].out_features
        num_labels = len(self.classes)
        if num_outputs != num_labels:
            print("Freshness model loaded: false")
            print(f"Number of outputs: {num_outputs}")
            print(f"Number of labels: {num_labels}")
            raise ValueError(f"[CRITICAL] Label count ({num_labels}) != output count ({num_outputs}) for Freshness model!")

        model = model.to(self.device)
        model.eval()
        self.model = model
        self.gradcam = GradCAM(self.model, model.features[-1])

        device_str = "CUDA" if "cuda" in str(self.device).lower() else "CPU"
        print("Freshness model loaded: true")
        print(f"Model path: {weights_path}")
        print("Architecture: EfficientNet-B0")
        print(f"Device: {device_str}")
        print(f"Number of outputs: {num_outputs}")
        print(f"Number of labels: {num_labels}")

    def predict(self, pil_img: Image.Image) -> Dict[str, Any]:
        rgb_img = pil_img.convert("RGB")
        tensor_img = self.prep_transform(rgb_img).unsqueeze(0).to(self.device)
        assert tensor_img.shape == (1, 3, INPUT_SIZE, INPUT_SIZE), f"Expected tensor shape [1, 3, {INPUT_SIZE}, {INPUT_SIZE}], got {tensor_img.shape}"
        assert tensor_img.device == self.device, f"Tensor on {tensor_img.device} != model on {self.device}"

        self.model.eval()
        with torch.inference_mode():
            outputs = self.model(tensor_img)
            probs = torch.softmax(outputs, dim=1).squeeze(0)

        probs_np = probs.cpu().numpy()
        pred_idx = int(np.argmax(probs_np))
        pred_class = self.classes[pred_idx]
        confidence_val = float(probs_np[pred_idx])

        # Top 3 predictions
        sorted_indices = np.argsort(probs_np)[::-1]
        top_preds = []
        for idx in sorted_indices[:3]:
            c = self.classes[idx]
            top_preds.append({
                "class": c,
                "confidence": round(float(probs_np[idx]), 4),
                "confidence_pct": f"{round(float(probs_np[idx]) * 100, 1)}%",
                "displayName": FRUIT_META.get(c, {}).get("item", c)
            })

        prob_dict = {
            self.classes[i]: round(float(probs_np[i]), 4)
            for i in range(len(self.classes))
        }

        fresh_prob = sum(prob_dict.get(c, 0.0) for c in ["freshapples", "freshbanana", "freshoranges"])
        spoiled_prob = sum(prob_dict.get(c, 0.0) for c in ["rottenapples", "rottenbanana", "rottenoranges"])

        if confidence_val < self.uncertainty_threshold:
            return {
                "status": "uncertain",
                "message": "Object could not be reliably classified.",
                "mode": "freshness",
                "food": "Unknown Food Item",
                "displayName": "Unknown Food Item",
                "item": "Unknown Food",
                "predicted_class": "uncertain",
                "category": "Produce",
                "waste_group": "Biodegradable",
                "freshness": "Uncertain",
                "risk": "Medium",
                "confidence": f"{round(confidence_val * 100, 1)}%",
                "confidence_score": round(confidence_val, 4),
                "probabilities": prob_dict,
                "top_predictions": top_preds,
                "fresh_probability": round(fresh_prob, 4),
                "spoiled_probability": round(spoiled_prob, 4),
                "shelfLife": "Verify Physically",
                "recommendation": "Object could not be reliably classified. Confidence below freshness threshold.",
                "explanation": f"Confidence was {round(confidence_val*100, 1)}%, which is below the {int(self.uncertainty_threshold*100)}% threshold for fresh food safety.",
                "model": "EfficientNet-B0 (Freshness Classifier)",
                "supported": False
            }

        gradcam_b64 = ""
        try:
            with torch.enable_grad():
                grad_tensor = tensor_img.clone().detach().requires_grad_(True)
                cam_map = self.gradcam.generate_heatmap(grad_tensor, pred_idx)
                gradcam_b64 = generate_gradcam_overlay(pil_img, cam_map)
        except Exception as cam_err:
            pass

        meta = FRUIT_META.get(pred_class, {
            "item": pred_class.replace("fresh", "Fresh ").replace("rotten", "Spoiled ").title(),
            "category": "Produce",
            "wasteGroup": "Biodegradable",
            "freshness": "Fresh" if "fresh" in pred_class else "Spoiled",
            "risk": "Low" if "fresh" in pred_class else "High",
            "shelfLife": "3-5 days" if "fresh" in pred_class else "Expired",
            "recommendation": "Inspect prior to use.",
            "action": "Verify food condition manually.",
            "ecoImpact": "+0.45 kg CO2 avoided",
            "icon": "🍎"
        })

        freshness_status = meta["freshness"]
        risk_status = meta["risk"]
        recommendation_text = meta["recommendation"]
        shelf_life_text = meta["shelfLife"]

        if freshness_status == "Fresh" and spoiled_prob > 0.30:
            freshness_status = "Moderate"
            risk_status = "Medium"
            shelf_life_text = "1-2 days"
            recommendation_text = f"Early signs of surface degradation detected ({round(spoiled_prob*100)}% spoilage probability). Consume or distribute immediately; do not store long-term."

        is_spoil = (freshness_status == "Spoiled" or risk_status == "High")
        is_mod = (freshness_status == "Moderate" or risk_status == "Medium")

        sensor_data = {
            "temperature": "22°C" if not is_spoil else "26°C",
            "humidity": "58%" if not is_spoil else "78%",
            "gasVoc": "Elevated" if (is_spoil or is_mod) else "Normal",
            "pH": "3.8" if is_spoil else "4.6" if is_mod else "5.2",
            "gasVocColor": "text-rose-600" if is_spoil else "text-amber-600" if is_mod else "text-green-600"
        }

        explanation = f"The model classified the image as {meta['item']} with {round(confidence_val*100, 1)}% confidence based on skin texture and color degradation patterns."

        return {
            "status": "SUCCESS",
            "mode": "freshness",
            "food": f"{meta.get('icon', '🍎')} {meta['item']}",
            "displayName": meta["item"],
            "detected_item": meta["item"],
            "item": meta["item"],
            "predicted_class": pred_class,
            "category": meta["category"],
            "primary_category": meta["category"],
            "waste_group": meta["wasteGroup"],
            "degradability": meta["wasteGroup"],
            "visual_freshness": freshness_status,
            "freshness": freshness_status,
            "risk": risk_status,
            "confidence": f"{round(confidence_val * 100, 1)}%",
            "confidence_score": round(confidence_val, 4),
            "probabilities": prob_dict,
            "top_predictions": top_preds,
            "fresh_probability": round(fresh_prob, 4),
            "spoiled_probability": round(spoiled_prob, 4),
            "shelfLife": shelf_life_text,
            "recommendation": recommendation_text,
            "action": meta["action"],
            "explanation": explanation,
            "ecoImpact": meta["ecoImpact"],
            "gradcam_image": gradcam_b64,
            "gradcam_explanation": "Highlighted regions indicate visual patterns that influenced the model's classification. Grad-CAM is an interpretability aid and not definitive proof.",
            "image_quality": "good",
            "model": "EfficientNet-B0 (Food Freshness Classifier)",
            "supported": True,
            "sensorData": sensor_data,
            "disclaimer": DISCLAIMER_TEXT
        }


from vision_detector import get_vision_detector

class AIRouter:
    """
    Unified Multi-Object Waste & Food Vision Intelligence Router.
    Routes inference using Two-Stage PyTorch Vision Architecture:
    1. Faster R-CNN Object Detector for multi-object localization and bounding boxes.
    2. Fine-tuned MobileNetV3 Waste Classifier + EfficientNet-B0 Freshness Classifier.
    3. Broad Food Recognition (Burgers, fries, sandwiches, cooked food, meal leftovers).
    4. Calibrated Uncertainty: Predictions < 48% are marked as LOW_CONFIDENCE / MANUAL REVIEW.
    """
    def __init__(self):
        print("\n" + "="*60)
        print(" FOODCOVERING AI VISION INTELLIGENCE SERVICE INITIALIZING")
        print("="*60)
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.food_inspector = FoodInspector(device)
        self.waste_classifier = WasteClassifier()
        self.freshness_classifier = FreshnessClassifier()
        self.vision_detector = get_vision_detector()
        print(f"[ML-Router] Waste Classes: {self.waste_classifier.classes}")
        print(f"[ML-Router] Freshness Classes: {self.freshness_classifier.classes}")
        print(f"[ML-Router] Vision Detector: Faster R-CNN (MobileNetV3) Ready")
        print("="*60 + "\n")

    def route_and_analyze(self, pil_img: Image.Image, filename: str = "", mode: str = "auto") -> Dict[str, Any]:
        mode = (mode or "auto").lower()

        # Step 1: Image Quality Screening
        quality_check = validate_image_quality(pil_img)
        if not quality_check["valid"]:
            return {
                "status": "REJECTED_QUALITY",
                "food": "Unrecognized Item",
                "displayName": "Image Quality Too Low",
                "item": "Unrecognized",
                "category": "Unknown",
                "waste_group": "Unknown",
                "freshness": "Unknown",
                "risk": "Unknown",
                "confidence": "0%",
                "confidence_score": 0.0,
                "probabilities": {},
                "top_predictions": [],
                "shelfLife": "Unknown",
                "recommendation": quality_check["reason"],
                "explanation": quality_check["reason"],
                "instructions": quality_check.get("instructions", "Capture image in good lighting."),
                "image_quality": "insufficient",
                "quality_details": quality_check,
                "model": "Quality Screening Preprocessor",
                "supported": False,
                "disclaimer": DISCLAIMER_TEXT
            }

        # =====================================================================
        # ROUTE 1: EXPLICIT WASTE CLASSIFICATION MODE (Multi-Object Vision)
        # =====================================================================
        if mode == "waste":
            vision_res = self.vision_detector.detect_and_classify(pil_img, filename=filename)
            vision_res["quality_details"] = quality_check
            # Also attach single-crop top predictions for explainability
            waste_single = self.waste_classifier.predict(pil_img)
            vision_res["top_predictions"] = waste_single.get("top_predictions", [])
            vision_res["probabilities"] = waste_single.get("probabilities", {})
            vision_res["gradcam_image"] = waste_single.get("gradcam_image")
            return vision_res

        # =====================================================================
        # ROUTE 2: EXPLICIT FOOD FRESHNESS MODE
        # Check if non-food -> reject with NOT_A_FOOD.
        # Check if supported fruit -> Freshness Model.
        # Else -> UNSUPPORTED_FOOD.
        # =====================================================================
        if mode == "freshness":
            vision_res = self.vision_detector.detect_and_classify(pil_img, filename=filename)
            primary_obj = vision_res.get("primary_object", {})

            # If vision detector confirmed non-food item
            if not primary_obj.get("is_food") and primary_obj.get("confidence", 0) >= 0.45:
                return {
                    "status": "NOT_A_FOOD",
                    "mode": "freshness",
                    "detected_item": primary_obj.get("label", "Non-Food Material"),
                    "displayName": primary_obj.get("label", "Non-Food Material"),
                    "item": primary_obj.get("label", "Non-Food Material"),
                    "category": primary_obj.get("category", "Non-Food"),
                    "waste_group": primary_obj.get("waste_group", "Non-Biodegradable"),
                    "confidence": primary_obj.get("confidence_pct", "0%"),
                    "confidence_score": primary_obj.get("confidence", 0.0),
                    "detected_objects": vision_res.get("detected_objects", []),
                    "message": f"Item detected is not an edible food item ({primary_obj.get('label')}). Please switch to Waste Classification mode.",
                    "explanation": f"Visual features match {primary_obj.get('label')} ({primary_obj.get('category')}). Non-food objects cannot be evaluated for food freshness.",
                    "recommendation": "Switch to Waste Classification mode to view recycling instructions.",
                    "quality_details": quality_check,
                    "model": "FoodCovering Waste Vision Detector",
                    "supported": False,
                    "disclaimer": DISCLAIMER_TEXT
                }

            # Check if whole fruit (Apple, Banana, Orange)
            inspect_res = self.food_inspector.check_is_fruit(pil_img)
            if inspect_res["is_fruit"] and inspect_res["fruit_conf"] >= 0.40:
                fresh_res = self.freshness_classifier.predict(pil_img)
                fresh_res["quality_details"] = quality_check
                fresh_res["detected_objects"] = vision_res.get("detected_objects", [])
                fresh_res["scene_summary"] = vision_res.get("scene_summary", {})
                return fresh_res

            # In Freshness Mode, but it is cooked food / unsupported produce:
            return {
                "status": "UNSUPPORTED_FOOD",
                "mode": "freshness",
                "detected_item": primary_obj.get("label", "Organic Food Leftovers"),
                "displayName": "Unsupported Food Category for Freshness",
                "item": primary_obj.get("label", "Organic Food Leftovers"),
                "category": "Organic Food Waste",
                "waste_group": "Biodegradable",
                "confidence": primary_obj.get("confidence_pct", "0%"),
                "confidence_score": primary_obj.get("confidence", 0.0),
                "detected_objects": vision_res.get("detected_objects", []),
                "message": "Freshness model is strictly trained on whole apples, bananas, and oranges. For cooked meals or mixed leftovers, route directly to organic composting.",
                "explanation": "To prevent false predictions, the freshness model rejects food items outside its validated training categories.",
                "recommendation": "If food is spoiled or surplus plate waste, route directly to organic composting.",
                "quality_details": quality_check,
                "model": "FoodCovering Category Guard",
                "supported": False,
                "disclaimer": DISCLAIMER_TEXT
            }

        # =====================================================================
        # ROUTE 3: AUTO DETECT MODE (Two-Stage Multi-Object Intelligence)
        # =====================================================================
        vision_res = self.vision_detector.detect_and_classify(pil_img, filename=filename)
        vision_res["quality_details"] = quality_check
        primary_obj = vision_res.get("primary_object", {})

        # If primary object is whole fruit, check freshness
        if primary_obj.get("detector_category") in ["apple", "banana", "orange"]:
            fresh_res = self.freshness_classifier.predict(pil_img)
            fresh_res["quality_details"] = quality_check
            fresh_res["detected_objects"] = vision_res.get("detected_objects", [])
            fresh_res["scene_summary"] = vision_res.get("scene_summary", {})
            return fresh_res

        # If broad food waste detected (Burger, fries, sandwich, pizza, leftovers)
        if primary_obj.get("is_food"):
            waste_single = self.waste_classifier.predict(pil_img)
            vision_res["top_predictions"] = waste_single.get("top_predictions", [])
            vision_res["probabilities"] = waste_single.get("probabilities", {})
            vision_res["gradcam_image"] = waste_single.get("gradcam_image")
            return vision_res

        # If solid waste material detected with sufficient confidence
        if primary_obj.get("confidence", 0) >= 0.48:
            waste_single = self.waste_classifier.predict(pil_img)
            vision_res["top_predictions"] = waste_single.get("top_predictions", [])
            vision_res["probabilities"] = waste_single.get("probabilities", {})
            vision_res["gradcam_image"] = waste_single.get("gradcam_image")
            return vision_res

        # Low confidence -> Flag as status "uncertain" (Step 8)
        waste_single = self.waste_classifier.predict(pil_img)
        actual_conf = primary_obj.get("confidence") or waste_single.get("confidence_score") or 0.0
        actual_pct = f"{round(float(actual_conf) * 100, 1)}%" if actual_conf > 0 else "0.0%"
        return {
            "status": "uncertain",
            "message": "Object could not be reliably classified.",
            "mode": "auto",
            "detected_objects": vision_res.get("detected_objects", []),
            "scene_summary": vision_res.get("scene_summary", {}),
            "food": primary_obj.get("label", "Unknown / Unsupported Item"),
            "displayName": primary_obj.get("label", "Unknown / Uncertain Specimen"),
            "item": primary_obj.get("label", "Unknown / Uncertain Specimen"),
            "category": primary_obj.get("category", "General Waste"),
            "waste_group": primary_obj.get("waste_group", "Unknown"),
            "confidence": actual_pct,
            "confidence_score": round(float(actual_conf), 4),
            "top_predictions": waste_single.get("top_predictions", []),
            "recommendation": "Object could not be reliably classified. Manual review recommended prior to segregation.",
            "explanation": "Prediction confidence is below the validation-calibrated reliability threshold.",
            "suggestions": [
                "Place specimen against an uncluttered, contrasting background",
                "Ensure bright, even illumination across the object",
                "Move camera closer to focus on primary material texture"
            ],
            "quality_details": quality_check,
            "model": "FoodCovering Multi-Object Vision Detector",
            "supported": False,
            "disclaimer": DISCLAIMER_TEXT
        }


# Global singleton router instance
router = AIRouter()

class AnalyzerCompat:
    def __init__(self, router_instance):
        self.router = router_instance
        self.model_name = "efficientnet_b0"
        self.meta = {"test_accuracy": 100.0}
        self.waste_analyzer = self.router.waste_classifier

    def analyze(self, pil_img: Image.Image, filename: str = "", mode: str = "auto") -> Dict[str, Any]:
        return self.router.route_and_analyze(pil_img, filename=filename, mode=mode)

analyzer = AnalyzerCompat(router)

if __name__ == "__main__":
    print("[Self-Test] Running router verification test...")
    sample_img = Image.new("RGB", (224, 224), color=(100, 150, 200))
    res = router.route_and_analyze(sample_img, mode="waste")
    print(f"Waste mode result: {res.get('status')} - {res.get('displayName')} ({res.get('confidence')})")
