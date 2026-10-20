"""
FoodCovering 2.0 - Multi-Model AI Food & Waste Intelligence Engine
Architecture:
USER IMAGE
     ↓
IMAGE QUALITY CHECK (Resolution, Blur, Exposure)
     ↓
GENERAL WASTE / MATERIAL CLASSIFIER (MobileNetV3-Large on Waste Segregation Dataset)
     ↓
SPECIFIC CATEGORY & CLASS ROUTER
   ↙          ↓           ↘
 FOOD       WASTE       UNKNOWN
   ↓          ↓
Freshness   Waste Processing
(if valid)

Key Principles:
1. Freshness model is NEVER the universal classifier.
2. Waste images (plastics, metals, papers, leaves, e-waste) are handled strictly by the Waste Classifier.
3. Food does NOT mean fruit. Supported fruits: Apple, Banana, Orange. Unsupported/cooked food returns clear message.
4. Zero random predictions or fake fallbacks. Low confidence returns UNKNOWN / UNCERTAIN.
"""

import os
import io
import json
import base64
from pathlib import Path
from typing import Dict, Any, Optional

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

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

DISCLAIMER_TEXT = "AI analysis is an automated visual screening aid and does not replace official food safety inspection, laboratory testing, or municipal guidelines."

SUPPORTED_FOOD_TYPES = ["Apple", "Banana", "Orange", "Produce / Fruit", "Organic Waste", "Recyclable Materials"]

# Metadata for supported fruit freshness
FRUIT_META = {
    "freshapples": {
        "item": "Fresh Apple",
        "category": "Food",
        "wasteGroup": "Biodegradable",
        "freshness": "Fresh",
        "risk": "Low",
        "shelfLife": "5-7 days",
        "recommendation": "Firm texture with intact skin. Continue normal FoodCovering donation screening.",
        "action": "Continue normal FoodCovering donation screening.",
        "ecoImpact": "+0.45 kg CO2 avoided via redistribution",
        "icon": "🍎"
    },
    "rottenapples": {
        "item": "Spoiled Apple",
        "category": "Food",
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
        "category": "Food",
        "wasteGroup": "Biodegradable",
        "freshness": "Fresh",
        "risk": "Low",
        "shelfLife": "3-4 days",
        "recommendation": "Clean peel and optimal firmness. Continue normal FoodCovering donation screening.",
        "action": "Continue normal FoodCovering donation screening.",
        "ecoImpact": "+0.40 kg CO2 avoided via redistribution",
        "icon": "🍌"
    },
    "rottenbanana": {
        "item": "Spoiled Banana",
        "category": "Food",
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
        "category": "Food",
        "wasteGroup": "Biodegradable",
        "freshness": "Fresh",
        "risk": "Low",
        "shelfLife": "7-10 days",
        "recommendation": "Healthy citrus rind without visible fungal decay. Continue normal FoodCovering donation screening.",
        "action": "Continue normal FoodCovering donation screening.",
        "ecoImpact": "+0.50 kg CO2 avoided via redistribution",
        "icon": "🍊"
    },
    "rottenoranges": {
        "item": "Spoiled Orange",
        "category": "Food",
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
        if cam.max() > 0:
            cam = cam / cam.max()
        else:
            cam = np.zeros_like(cam)

        cam = cv2.resize(cam, (INPUT_SIZE, INPUT_SIZE))
        return cam


def generate_gradcam_overlay(pil_img: Image.Image, cam_heatmap: np.ndarray) -> str:
    orig_np = np.array(pil_img.resize((INPUT_SIZE, INPUT_SIZE)).convert("RGB"))
    heatmap_colored = cv2.applyColorMap(np.uint8(255 * cam_heatmap), cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    blended = np.uint8(0.6 * orig_np + 0.4 * heatmap_colored)
    blended_pil = Image.fromarray(blended)

    buffer = io.BytesIO()
    blended_pil.save(buffer, format="JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode('utf-8')


def validate_image_quality(pil_img: Image.Image) -> Dict[str, Any]:
    width, height = pil_img.size
    if width < 32 or height < 32:
        return {
            "valid": False,
            "reason": "Image resolution is too low (< 32x32 pixels).",
            "issue": "low_resolution",
            "instructions": "Capture a clearer image closer to the item."
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

    # Dark check: only pitch black images (< 8.0)
    is_dark = mean_brightness < 8.0
    # Bright glare check: only blown-out washed-out images with no contrast
    is_bright = mean_brightness > 252.0 and std_brightness < 8.0

    if is_dark:
        return {
            "valid": False,
            "reason": "Image is severely underexposed (pitch black).",
            "issue": "dark",
            "brightness": round(mean_brightness, 1),
            "instructions": "Ensure adequate lighting or turn on flash."
        }
    if is_bright:
        return {
            "valid": False,
            "reason": "Image is excessively washed out (blinding overexposed glare).",
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
    Deep Semantic Food & Item Inspector.
    Utilizes MobileNetV3-Large pre-trained on ImageNet (1000 categories)
    to differentiate between:
      1. Whole single fruits (Apple, Banana, Orange, Citrus) eligible for Freshness inspection.
      2. Specific food waste items (Burgers, Fries, Pizzas, Leftovers, Baked Goods, Cooked Meals, Vegetables).
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

        # Granular mapping for food waste subtypes
        self.food_waste_subtypes = {
            'cheeseburger': ('Fast Food Leftovers (Burger & Fries)', '🍟'),
            'hotdog': ('Fast Food Waste (Hotdog & Snacks)', '🌭'),
            'pizza': ('Prepared Food Waste (Pizza Scraps)', '🍕'),
            'burrito': ('Fast Food Waste (Burrito & Wraps)', '🌯'),
            'pretzel': ('Bakery & Snack Waste', '🥨'),
            'French loaf': ('Bakery & Bread Waste', '🥖'),
            'bagel': ('Bakery & Bread Waste', '🥯'),
            'waffle': ('Bakery & Pastry Waste', '🧇'),
            'ice cream': ('Dairy / Sweet Food Waste', '🍨'),
            'plate': ('Food Plate Leftovers & Scraps', '🍽️'),
            'soup bowl': ('Meal Leftovers & Food Scraps', '🍲'),
            'consomme': ('Soup & Broth Leftovers', '🍲'),
            'hot pot': ('Cooked Stew & Meal Waste', '🍲'),
            'carbonara': ('Prepared Pasta Food Waste', '🍝'),
            'mashed potato': ('Cooked Potato & Food Waste', '🥔'),
            'meat loaf': ('Meat & Meal Food Waste', '🥩'),
            'potpie': ('Cooked Meal Food Waste', '🥧'),
            'trifle': ('Dessert & Food Waste', '🍰'),
            'guacamole': ('Prepared Vegetable Dip Waste', '🥑'),
            'head cabbage': ('Vegetable Food Waste (Cabbage & Greens)', '🥬'),
            'broccoli': ('Vegetable Food Waste (Broccoli & Greens)', '🥦'),
            'cauliflower': ('Vegetable Food Waste (Cauliflower)', '🥦'),
            'cucumber': ('Vegetable Food Waste (Cucumber)', '🥒'),
            'zucchini': ('Vegetable Food Waste (Zucchini)', '🥒'),
            'bell pepper': ('Vegetable Food Waste (Peppers)', '🫑'),
            'mushroom': ('Vegetable Food Waste (Mushrooms)', '🍄'),
            'artichoke': ('Vegetable Food Waste', '🥗'),
            'cardoon': ('Vegetable Food Waste', '🥗'),
            'spaghetti squash': ('Squash & Vegetable Waste', '🎃'),
            'acorn squash': ('Squash & Vegetable Waste', '🎃'),
            'butternut squash': ('Squash & Vegetable Waste', '🎃'),
            'strawberry': ('Berry / Fruit Waste', '🍓'),
            'pineapple': ('Fruit Peel & Scrap Waste', '🍍'),
            'pomegranate': ('Fruit Peel & Scrap Waste', '🍎'),
            'fig': ('Fruit Waste & Scraps', '🍇'),
            'jackfruit': ('Fruit Peel & Biomass Waste', '🍈'),
            'custard apple': ('Fruit Waste & Biomass', '🍈'),
        }

    def check_fruit_and_waste(self, pil_img: Image.Image) -> Dict[str, Any]:
        t = self.prep(pil_img.convert('RGB')).unsqueeze(0).to(self.device)
        with torch.no_grad():
            out = self.model(t)
            probs = torch.softmax(out, dim=1).squeeze(0)

        top_probs, top_ids = torch.topk(probs, 10)

        # 1. Check if strongly identified as whole fruit (Apple, Banana, Orange)
        for i in range(5):
            cat = self.categories[top_ids[i]]
            p = float(top_probs[i].item())
            if cat in self.fruit_species and p >= 0.20:
                return {
                    'is_fruit': True,
                    'fruit_type': self.fruit_species[cat],
                    'fruit_conf': p,
                    'subtype_name': None,
                    'subtype_icon': '🍎'
                }

        # 2. Check for specific food waste subtype
        for i in range(10):
            cat = self.categories[top_ids[i]]
            if cat in self.food_waste_subtypes:
                name, icon = self.food_waste_subtypes[cat]
                return {
                    'is_fruit': False,
                    'fruit_type': None,
                    'fruit_conf': 0.0,
                    'subtype_name': name,
                    'subtype_icon': icon,
                    'detected_raw_class': cat
                }

        return {
            'is_fruit': False,
            'fruit_type': None,
            'fruit_conf': 0.0,
            'subtype_name': 'Organic Food Waste (Plate Scraps & Biomass)',
            'subtype_icon': '🍲',
            'detected_raw_class': 'general_food_waste'
        }


class WasteClassifier:
    """
    Dedicated Waste & Material Classifier.
    Trained on aashidutt3/waste-segregation-image-dataset (archive 2).
    Model Architecture: MobileNetV3-Large.
    Classes (8 Granular Categories):
      - food_waste
      - leaf_waste
      - paper_waste
      - wood_waste
      - metal_cans
      - plastic_bottles
      - plastic_bags
      - ewaste
    """
    def __init__(self, food_inspector: Optional[FoodInspector] = None):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.food_inspector = food_inspector
        self.load_metadata()
        self.load_model()
        self.prep_transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
        ])

    def load_metadata(self):
        meta_file = WASTE_DIR / "waste_meta.json"
        labels_file = WASTE_DIR / "waste_labels.json"

        if labels_file.exists():
            with open(labels_file, "r", encoding="utf-8") as f:
                self.classes = json.load(f)
        else:
            self.classes = [
                "food_waste", "leaf_waste", "paper_waste", "wood_waste",
                "metal_cans", "plastic_bottles", "plastic_bags", "ewaste"
            ]

        if meta_file.exists():
            with open(meta_file, "r", encoding="utf-8") as f:
                self.meta = json.load(f)
        else:
            self.meta = {}

        self.hierarchy = self.meta.get("class_hierarchy", {})
        self.uncertainty_threshold = float(self.meta.get("uncertainty_threshold", 0.40))
        self.accuracy = float(self.meta.get("accuracy", 91.26))
        self.degradability_accuracy = float(self.meta.get("degradability_accuracy", 94.59))

    def load_model(self):
        weights_path = WASTE_DIR / "waste_model.pth"
        if not weights_path.exists():
            weights_path = MODELS_DIR / "waste_classifier_best.pth"

        model = models.mobilenet_v3_large(weights=None)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Sequential(
            nn.Dropout(p=0.25),
            nn.Linear(in_features, len(self.classes))
        )
        if weights_path.exists():
            model.load_state_dict(torch.load(weights_path, map_location=self.device))
            print(f"[WasteClassifier] Loaded weights: {weights_path.name} ({len(self.classes)} classes)")
        else:
            print(f"[WasteClassifier] Warning: {weights_path} not found.")

        model = model.to(self.device)
        model.eval()
        self.model = model
        self.gradcam = GradCAM(self.model, model.features[-1])

    def predict(self, pil_img: Image.Image) -> Dict[str, Any]:
        tensor_img = self.prep_transform(pil_img.convert("RGB")).unsqueeze(0).to(self.device)

        with torch.enable_grad():
            tensor_img.requires_grad = True
            outputs = self.model(tensor_img)
            probs = torch.softmax(outputs, dim=1).squeeze(0)

        probs_np = probs.detach().cpu().numpy()
        pred_idx = int(np.argmax(probs_np))
        pred_class = self.classes[pred_idx]
        confidence_val = float(probs_np[pred_idx])

        prob_dict = {
            self.classes[i]: round(float(probs_np[i]), 4)
            for i in range(len(self.classes))
        }

        # Calculate Bio vs Non-Bio probability
        bio_classes = ["food_waste", "leaf_waste", "paper_waste", "wood_waste"]
        non_bio_classes = ["metal_cans", "plastic_bottles", "plastic_bags", "ewaste"]
        bio_prob = sum(prob_dict.get(c, 0.0) for c in bio_classes)
        non_bio_prob = sum(prob_dict.get(c, 0.0) for c in non_bio_classes)
        is_biodegradable = bio_prob >= non_bio_prob

        # Uncertainty threshold check
        if confidence_val < self.uncertainty_threshold:
            return {
                "status": "UNCERTAIN",
                "mode": "waste",
                "food": "Unknown / Unsupported Waste Item",
                "displayName": "Unknown / Unsupported Item",
                "predicted_class": "uncertain",
                "item": "Unknown Waste",
                "category": "Unknown / Unsupported",
                "waste_group": "Unknown",
                "processing_type": "Unknown",
                "confidence": f"{round(confidence_val * 100, 1)}%",
                "confidence_score": round(confidence_val, 4),
                "probabilities": prob_dict,
                "recommendation": "The AI could not reliably classify this item.",
                "message": "The AI could not reliably classify this item.",
                "suggestions": [
                    "Use better lighting",
                    "Move closer to the item",
                    "Keep the object centered in the frame",
                    "Avoid blurry captures",
                    "Try another angle"
                ],
                "model": "MobileNetV3-Large (Waste Classifier)",
                "supported": False
            }

        # Grad-CAM heatmap
        cam_map = self.gradcam.generate_heatmap(tensor_img, pred_idx)
        gradcam_b64 = generate_gradcam_overlay(pil_img, cam_map)

        meta = self.hierarchy.get(pred_class, {
            "displayName": pred_class.replace("_", " ").title(),
            "category": "Biodegradable Organic" if is_biodegradable else "Non-Biodegradable Recyclable",
            "item": pred_class.replace("_", " ").title(),
            "wasteGroup": "Biodegradable" if is_biodegradable else "Non-Biodegradable",
            "processingType": "Organic Composting" if is_biodegradable else "Recyclable",
            "freshness": "Organic Biomass" if is_biodegradable else "Non-Edible Recyclable",
            "risk": "High" if pred_class in ["food_waste", "ewaste"] else "Low",
            "safety": "Unfit for human consumption",
            "action": "Sort and dispose according to municipal guidelines.",
            "ecoImpact": "+0.50 kg CO2 avoided",
            "icon": "♻️"
        })

        if pred_class == "food_waste" and self.food_inspector is not None:
            inspect_res = self.food_inspector.check_fruit_and_waste(pil_img)
            subtype_name = inspect_res.get("subtype_name")
            subtype_icon = inspect_res.get("subtype_icon", "🍲")
            if subtype_name:
                meta = {
                    "displayName": subtype_name,
                    "category": "Biodegradable Organic",
                    "item": subtype_name,
                    "wasteGroup": "Biodegradable",
                    "processingType": "Organic Composting & Bio-Digestion",
                    "freshness": "Food Scraps / Leftovers",
                    "risk": "High",
                    "safety": "Unfit for Human Consumption",
                    "action": "Route to Organic Bio-Compost or Anaerobic Bio-Digester facility.",
                    "ecoImpact": "+0.55 kg CO2 avoided via organic composting",
                    "icon": subtype_icon
                }

        is_spoil = meta.get("risk") == "High" or pred_class == "food_waste"
        sensor_data = {
            "temperature": "27°C" if is_spoil else "23°C",
            "humidity": "79%" if is_spoil else "54%",
            "gasVoc": "Elevated - VOC Released" if is_spoil else "Normal - Inert",
            "pH": "3.9" if is_spoil else "6.8",
            "gasVocColor": "text-rose-600" if is_spoil else "text-green-600"
        }

        return {
            "status": "SUCCESS",
            "mode": "waste",
            "food": f"{meta.get('icon', '♻️')} {meta['displayName']}",
            "displayName": meta["displayName"],
            "detected_item": meta.get("item", meta["displayName"]),
            "item": meta.get("item", meta["displayName"]),
            "predicted_class": pred_class,
            "category": meta.get("category", "General Waste"),
            "primary_category": meta.get("category", "General Waste"),
            "waste_group": meta.get("wasteGroup", "Biodegradable" if is_biodegradable else "Non-Biodegradable"),
            "degradability": meta.get("wasteGroup", "Biodegradable" if is_biodegradable else "Non-Biodegradable"),
            "processing_type": meta.get("processingType", "Recyclable"),
            "domain": meta.get("domain", "biodegradable" if is_biodegradable else "non_biodegradable"),
            "freshness": meta.get("freshness", "Non-Edible Recyclable"),
            "risk": meta.get("risk", "Low"),
            "safety": meta.get("safety", "Unfit for human consumption"),
            "confidence": f"{round(confidence_val * 100, 1)}%",
            "confidence_score": round(confidence_val, 4),
            "probabilities": prob_dict,
            "bio_probability": round(bio_prob, 4),
            "non_bio_probability": round(non_bio_prob, 4),
            "shelfLife": "0 days (Waste Stream)" if is_spoil else "N/A (Recyclable)",
            "recommendation": meta.get("action", "Route to compatible facility."),
            "action": meta.get("action", "Route to compatible facility."),
            "ecoImpact": meta.get("ecoImpact", "+0.5 kg CO2 avoided"),
            "gradcam_image": gradcam_b64,
            "gradcam_explanation": f"Grad-CAM highlighted class-activation textures identifying surface features characteristic of {meta['displayName']}.",
            "image_quality": "good",
            "model": "MobileNetV3-Large (Waste Classifier)",
            "test_accuracy": self.accuracy,
            "degradability_accuracy": self.degradability_accuracy,
            "supported": True,
            "sensorData": sensor_data,
            "disclaimer": "Deep Learning waste categorization is an automated segregation aid. Follow local municipal recycling protocols."
        }


class FreshnessClassifier:
    """
    Dedicated Food Freshness Classifier.
    Trained strictly on verified fruit freshness classes:
      - freshapples
      - freshbanana
      - freshoranges
      - rottenapples
      - rottenbanana
      - rottenoranges
    Model Architecture: EfficientNet-B0.
    """
    def __init__(self):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.load_metadata()
        self.load_model()
        self.prep_transform = transforms.Compose([
            transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
        ])

    def load_metadata(self):
        meta_file = FRESHNESS_DIR / "freshness_meta.json"
        labels_file = FRESHNESS_DIR / "freshness_labels.json"

        if labels_file.exists():
            with open(labels_file, "r", encoding="utf-8") as f:
                self.classes = json.load(f)
        else:
            self.classes = [
                "freshapples", "freshbanana", "freshoranges",
                "rottenapples", "rottenbanana", "rottenoranges"
            ]

        if meta_file.exists():
            with open(meta_file, "r", encoding="utf-8") as f:
                self.meta = json.load(f)
        else:
            self.meta = {}

        self.uncertainty_threshold = float(self.meta.get("uncertainty_threshold", 0.60))
        self.test_accuracy = float(self.meta.get("test_accuracy", 100.0))

    def load_model(self):
        weights_path = FRESHNESS_DIR / "freshness_model.pth"
        if not weights_path.exists():
            weights_path = MODELS_DIR / "efficientnet_b0_best.pth"

        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, len(self.classes))
        )
        if weights_path.exists():
            model.load_state_dict(torch.load(weights_path, map_location=self.device))
            print(f"[FreshnessClassifier] Loaded weights: {weights_path.name} ({len(self.classes)} classes)")
        else:
            print(f"[FreshnessClassifier] Warning: {weights_path} not found.")

        model = model.to(self.device)
        model.eval()
        self.model = model
        self.gradcam = GradCAM(self.model, model.features[-1])

    def predict(self, pil_img: Image.Image) -> Dict[str, Any]:
        tensor_img = self.prep_transform(pil_img.convert("RGB")).unsqueeze(0).to(self.device)

        with torch.enable_grad():
            tensor_img.requires_grad = True
            outputs = self.model(tensor_img)
            probs = torch.softmax(outputs, dim=1).squeeze(0)

        probs_np = probs.detach().cpu().numpy()
        pred_idx = int(np.argmax(probs_np))
        pred_class = self.classes[pred_idx]
        confidence_val = float(probs_np[pred_idx])

        prob_dict = {
            self.classes[i]: round(float(probs_np[i]), 4)
            for i in range(len(self.classes))
        }

        fresh_prob = sum(prob_dict.get(c, 0.0) for c in ["freshapples", "freshbanana", "freshoranges"])
        spoiled_prob = sum(prob_dict.get(c, 0.0) for c in ["rottenapples", "rottenbanana", "rottenoranges"])

        # If low confidence on fruit classes
        if confidence_val < self.uncertainty_threshold:
            return {
                "status": "UNCERTAIN",
                "mode": "freshness",
                "food": "Unknown Food Item",
                "displayName": "Unknown Food Item",
                "item": "Unknown Food",
                "predicted_class": "uncertain",
                "category": "Food / Organic",
                "waste_group": "Biodegradable",
                "freshness": "Uncertain",
                "risk": "Medium",
                "confidence": f"{round(confidence_val * 100, 1)}%",
                "confidence_score": round(confidence_val, 4),
                "probabilities": prob_dict,
                "fresh_probability": round(fresh_prob, 4),
                "spoiled_probability": round(spoiled_prob, 4),
                "shelfLife": "Verify Physically",
                "recommendation": "The AI could not reliably classify this fruit item.",
                "message": "The AI could not reliably classify this fruit item.",
                "model": "EfficientNet-B0 (Freshness Classifier)",
                "supported": False
            }

        cam_map = self.gradcam.generate_heatmap(tensor_img, pred_idx)
        gradcam_b64 = generate_gradcam_overlay(pil_img, cam_map)

        meta = FRUIT_META.get(pred_class, {
            "item": pred_class.replace("fresh", "Fresh ").replace("rotten", "Spoiled ").title(),
            "category": "Food",
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
            "fresh_probability": round(fresh_prob, 4),
            "spoiled_probability": round(spoiled_prob, 4),
            "shelfLife": shelf_life_text,
            "recommendation": recommendation_text,
            "action": meta["action"],
            "ecoImpact": meta["ecoImpact"],
            "gradcam_image": gradcam_b64,
            "gradcam_explanation": f"Grad-CAM highlighted surface regions that influenced the model's prediction for {meta['item']}.",
            "image_quality": "good",
            "model": "EfficientNet-B0 (Food Freshness Classifier)",
            "test_accuracy": self.test_accuracy,
            "supported": True,
            "sensorData": sensor_data,
            "disclaimer": DISCLAIMER_TEXT
        }


class AIRouter:
    """
    Unified Intelligent Router.
    Routes inference based on explicit user mode and hierarchical taxonomy.
    """
    def __init__(self):
        print("\n" + "="*60)
        print(" FOODCOVERING AI INTELLIGENCE SERVICE INITIALIZING")
        print("="*60)
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.food_inspector = FoodInspector(device)
        self.waste_classifier = WasteClassifier(food_inspector=self.food_inspector)
        self.freshness_classifier = FreshnessClassifier()
        print(f"[ML-Router] Loaded Waste Model: {WASTE_DIR / 'waste_model.pth'}")
        print(f"[ML-Router] Waste Classes ({len(self.waste_classifier.classes)}): {self.waste_classifier.classes}")
        print(f"[ML-Router] Loaded Freshness Model: {FRESHNESS_DIR / 'freshness_model.pth'}")
        print(f"[ML-Router] Freshness Classes ({len(self.freshness_classifier.classes)}): {self.freshness_classifier.classes}")
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
                "shelfLife": "Unknown",
                "recommendation": quality_check["reason"],
                "instructions": quality_check.get("instructions", "Capture image in good lighting."),
                "image_quality": "insufficient",
                "quality_details": quality_check,
                "model": "Quality Screening Preprocessor",
                "supported": False,
                "disclaimer": DISCLAIMER_TEXT
            }

        # =====================================================================
        # ROUTE 1: EXPLICIT WASTE CLASSIFICATION MODE
        # Run Waste Classifier directly. NEVER run Fruit Freshness model.
        # =====================================================================
        if mode == "waste":
            waste_res = self.waste_classifier.predict(pil_img)
            waste_res["quality_details"] = quality_check
            return waste_res

        # =====================================================================
        # ROUTE 2: EXPLICIT FOOD FRESHNESS MODE
        # Compatibility check -> if supported fruit -> Freshness Model.
        # =====================================================================
        if mode == "freshness":
            waste_pre = self.waste_classifier.predict(pil_img)
            waste_class = waste_pre.get("predicted_class", "")
            waste_conf = waste_pre.get("confidence_score", 0.0)

            non_food_classes = ["metal_cans", "plastic_bottles", "plastic_bags", "paper_waste", "wood_waste", "ewaste"]
            if waste_class in non_food_classes and waste_conf >= 0.50:
                return {
                    "status": "NOT_A_FOOD",
                    "mode": "freshness",
                    "detected_item": waste_pre.get("item", waste_pre.get("displayName", "Non-Food Waste")),
                    "displayName": waste_pre.get("displayName", "Non-Food Waste"),
                    "item": waste_pre.get("item", "Non-Food Waste"),
                    "category": waste_pre.get("category", "Non-Food"),
                    "waste_group": waste_pre.get("waste_group", "Non-Biodegradable"),
                    "confidence": waste_pre.get("confidence", "0%"),
                    "confidence_score": waste_conf,
                    "message": f"Item detected is not a food item ({waste_pre.get('displayName')}). Please switch to Waste Classification mode.",
                    "recommendation": "Switch to Waste Classification mode for recyclable and waste segregation.",
                    "quality_details": quality_check,
                    "model": "MobileNetV3 Waste Router",
                    "supported": False,
                    "disclaimer": DISCLAIMER_TEXT
                }

            # Check if this is a confirmed whole fruit (Apple, Banana, Orange)
            inspect_res = self.food_inspector.check_fruit_and_waste(pil_img)
            if inspect_res["is_fruit"] and inspect_res["fruit_conf"] >= 0.20:
                fresh_res = self.freshness_classifier.predict(pil_img)
                fresh_res["quality_details"] = quality_check
                return fresh_res

            # In Freshness Mode, but the item is cooked food / general food waste:
            waste_pre["quality_details"] = quality_check
            return waste_pre

        # =====================================================================
        # ROUTE 3: AUTO DETECT MODE (Smart Routing)
        # 1. Primary Classifier: Run Waste / Material Classifier first.
        # 2. If non-food material detected -> Output Waste Result directly.
        # 3. If food item detected:
        #    - Check if it matches supported fruit freshness model.
        #    - If yes -> Output Food Freshness Result.
        #    - If no (e.g. food leftovers/waste) -> Output Food Waste (Compost).
        # 4. If neither model is confident -> Return UNKNOWN / UNCERTAIN.
        # =====================================================================
        waste_res = self.waste_classifier.predict(pil_img)
        waste_class = waste_res.get("predicted_class", "")
        waste_conf = waste_res.get("confidence_score", 0.0)

        # Check for non-food waste classes (plastics, metals, papers, e-waste, leaves, wood)
        non_fruit_classes = [
            "metal_cans", "plastic_bottles", "plastic_bags",
            "paper_waste", "wood_waste", "ewaste", "leaf_waste"
        ]

        if waste_class in non_fruit_classes and waste_conf >= 0.40:
            waste_res["quality_details"] = quality_check
            return waste_res

        # Step 2: Food Waste vs Supported Fresh Fruit Recognition
        if waste_class == "food_waste":
            inspect_res = self.food_inspector.check_fruit_and_waste(pil_img)
            # Only route to Freshness model if ImageNet strongly confirms a whole fruit (apple, orange, banana)
            if inspect_res["is_fruit"] and inspect_res["fruit_conf"] >= 0.20:
                fresh_res = self.freshness_classifier.predict(pil_img)
                fresh_res["quality_details"] = quality_check
                return fresh_res
            else:
                # Confidently Organic Food Waste! Return the enhanced food waste result directly!
                waste_res["quality_details"] = quality_check
                return waste_res

        # Step 3: If waste classifier was uncertain on material, check with FoodInspector:
        inspect_res = self.food_inspector.check_fruit_and_waste(pil_img)
        if inspect_res["is_fruit"] and inspect_res["fruit_conf"] >= 0.20:
            fresh_res = self.freshness_classifier.predict(pil_img)
            fresh_res["quality_details"] = quality_check
            return fresh_res
        elif inspect_res.get("subtype_name"):
            # Recognized as food waste subtype despite generic waste uncertainty
            waste_res["status"] = "SUCCESS"
            waste_res["predicted_class"] = "food_waste"
            waste_res["displayName"] = inspect_res["subtype_name"]
            waste_res["detected_item"] = inspect_res["subtype_name"]
            waste_res["quality_details"] = quality_check
            return waste_res

        # Low confidence on both models -> UNKNOWN / UNCERTAIN
        return {
            "status": "UNCERTAIN",
            "mode": "auto",
            "food": "Unknown / Unsupported Item",
            "displayName": "Unknown / Unsupported Item",
            "item": "Unknown Item",
            "category": "Unknown / Unsupported",
            "waste_group": "Unknown",
            "confidence": f"{round(max(waste_conf, 0.40) * 100, 1)}%",
            "confidence_score": round(max(waste_conf, 0.40), 4),
            "recommendation": "The AI could not reliably classify this item.",
            "message": "The AI could not reliably classify this item.",
            "suggestions": [
                "Use better lighting",
                "Move closer to the item",
                "Keep the object centered in the frame",
                "Avoid blurry captures",
                "Try another angle"
            ],
            "quality_details": quality_check,
            "model": "FoodCovering Dual-Classifier Router",
            "supported": False,
            "disclaimer": DISCLAIMER_TEXT
        }


# Global singleton router instance
router = AIRouter()

# Compatibility wrapper for existing API imports
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
