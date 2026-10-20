"""
FoodCovering 2.0 - Deep Learning Waste & Biodegradability Classifier
Dataset: C:\\Users\\PRAVEEN\\Downloads\\archive (2)\\Dataset
Classes (8 Granular Categories):
- Biodegradable: food_waste, leaf_waste, paper_waste, wood_waste
- Non-Biodegradable: metal_cans, plastic_bottles, plastic_bags, ewaste
Hardware: NVIDIA GPU (CUDA acceleration)
"""

import os
import sys
import json
import time
import random
from pathlib import Path
from collections import Counter

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

DATASET_ROOT = Path(r"C:\Users\PRAVEEN\Downloads\archive (2)\Dataset")
ML_DIR = Path(__file__).parent
MODELS_DIR = ML_DIR / "models"
REPORTS_DIR = ML_DIR / "reports"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# 8 Granular Classes from archive (2)
CLASSES = [
    "food_waste",
    "leaf_waste",
    "paper_waste",
    "wood_waste",
    "metal_cans",
    "plastic_bottles",
    "plastic_bags",
    "ewaste"
]

CLASS_TO_IDX = {cls_name: idx for idx, cls_name in enumerate(CLASSES)}

CLASS_HIERARCHY = {
    "food_waste": {
        "domain": "biodegradable",
        "displayName": "Organic Food Waste",
        "category": "Biodegradable Organic",
        "freshness": "Spoiled / Food Scraps",
        "risk": "High",
        "safety": "Unfit for Human Consumption",
        "action": "Route to Organic Compost / Anaerobic Bio-digester",
        "ecoImpact": "+0.45 kg CO2 avoided via composting",
        "icon": "🍲"
    },
    "leaf_waste": {
        "domain": "biodegradable",
        "displayName": "Garden Green Waste",
        "category": "Biodegradable Biomass",
        "freshness": "Organic Biomass",
        "risk": "Low",
        "safety": "Non-edible Biomass",
        "action": "Deposit into Green Organic Bin / Mulch Facility",
        "ecoImpact": "+0.32 kg CO2 avoided",
        "icon": "🍂"
    },
    "paper_waste": {
        "domain": "biodegradable",
        "displayName": "Cardboard & Paper",
        "category": "Biodegradable Recyclable",
        "freshness": "Dry Packaging",
        "risk": "Low",
        "safety": "Non-edible Packaging",
        "action": "Route to Paper & Cardboard Pulp Recycler",
        "ecoImpact": "+0.80 kg CO2 avoided via paper recycling",
        "icon": "📦"
    },
    "wood_waste": {
        "domain": "biodegradable",
        "displayName": "Timber & Wood Scrap",
        "category": "Biodegradable Biomass",
        "freshness": "Lignin Biomass",
        "risk": "Low",
        "safety": "Non-edible Material",
        "action": "Deposit to Wood Recovery / Biomass Energy Plant",
        "ecoImpact": "+0.60 kg CO2 avoided",
        "icon": "🪵"
    },
    "metal_cans": {
        "domain": "non_biodegradable",
        "displayName": "Metal Cans & Tins",
        "category": "Non-Biodegradable Recyclable",
        "freshness": "Metal Packaging",
        "risk": "Low",
        "safety": "Non-edible Container",
        "action": "Rinse and deposit into Blue Dry Recyclables Bin",
        "ecoImpact": "+1.25 kg CO2 avoided via aluminum recycling",
        "icon": "🥫"
    },
    "plastic_bottles": {
        "domain": "non_biodegradable",
        "displayName": "PET Plastic Bottles",
        "category": "Non-Biodegradable Recyclable",
        "freshness": "Plastic Packaging",
        "risk": "Low",
        "safety": "Non-edible Container",
        "action": "Crush & deposit into Specialized Plastic Recycler",
        "ecoImpact": "+1.10 kg CO2 avoided via polymer recovery",
        "icon": "🧴"
    },
    "plastic_bags": {
        "domain": "non_biodegradable",
        "displayName": "Plastic Bags & Wrappers",
        "category": "Non-Biodegradable Polymer",
        "freshness": "Soft Film Waste",
        "risk": "Medium",
        "safety": "Non-edible Material",
        "action": "Deliver to Soft Plastics / Specialized Drop-off Point",
        "ecoImpact": "+0.70 kg CO2 avoided",
        "icon": "🛍️"
    },
    "ewaste": {
        "domain": "non_biodegradable",
        "displayName": "Electronic Scrap",
        "category": "Non-Biodegradable Hazardous",
        "freshness": "Electronic Hardware",
        "risk": "High",
        "safety": "Hazardous Electronic Material",
        "action": "Deliver to Designated Municipal E-Waste Facility",
        "ecoImpact": "+2.40 kg CO2 avoided via heavy metal reclamation",
        "icon": "💻"
    }
}

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

class WasteDataset(Dataset):
    def __init__(self, items, transform=None):
        self.items = items  # list of (path_str, class_idx)
        self.transform = transform

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        img_path, class_idx = self.items[idx]
        try:
            with open(img_path, "rb") as f:
                img = Image.open(f).convert("RGB")
        except Exception:
            img = Image.new("RGB", (INPUT_SIZE, INPUT_SIZE), color=(128, 128, 128))

        if self.transform:
            img = self.transform(img)

        return img, class_idx

def scan_split_files(split_dir: Path, max_per_class: int = 700):
    """
    Finds all images in biodegradable and non_biodegradable subfolders.
    Caps high-volume classes (like food_waste with 10k items) to max_per_class
    to balance classes and ensure fast, convergence-focused training on GPU.
    """
    class_items = {c: [] for c in CLASSES}
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    for category in ["biodegradable", "non_biodegradable"]:
        cat_dir = split_dir / category
        if not cat_dir.exists():
            continue
        for sub_dir in cat_dir.iterdir():
            if sub_dir.is_dir() and sub_dir.name in CLASS_TO_IDX:
                cls_name = sub_dir.name
                files = [f for f in sub_dir.glob("*.*") if f.suffix.lower() in valid_extensions]
                class_items[cls_name].extend(files)

    final_items = []
    print(f"\n[Dataset] Scanning split: {split_dir.name}", flush=True)
    for cls_name, files in class_items.items():
        random.seed(42)
        random.shuffle(files)
        selected = files[:max_per_class] if max_per_class else files
        print(f"  - {cls_name:16}: total {len(files)} -> sampled {len(selected)}", flush=True)
        for f in selected:
            final_items.append((str(f), CLASS_TO_IDX[cls_name]))

    random.shuffle(final_items)
    return final_items

def plot_confusion_matrix(cm, classes, output_path):
    plt.figure(figsize=(9, 7))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Waste & Degradability Classification Confusion Matrix', fontsize=12, fontweight='bold')
    plt.colorbar()
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, rotation=45, ha='right', fontsize=9)
    plt.yticks(tick_marks, classes, fontsize=9)

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black",
                     fontsize=9)

    plt.ylabel('True Class', fontweight='bold')
    plt.xlabel('Predicted Class', fontweight='bold')
    plt.tight_layout()
    plt.savefig(output_path, dpi=180)
    plt.close()
    print(f"[Plot] Saved confusion matrix to: {output_path.name}", flush=True)

def train_waste_model(epochs: int = 3, batch_size: int = 32, lr: float = 2e-4):
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    print(f"============================================================", flush=True)
    print(f" FoodCovering 2.0 - Deep Learning Training Pipeline", flush=True)
    print(f" Dataset: {DATASET_ROOT}", flush=True)
    print(f" Device:  {device} ({gpu_name})", flush=True)
    print(f" Epochs:  {epochs} | Batch Size: {batch_size} | LR: {lr}", flush=True)
    print(f"============================================================", flush=True)

    train_dir = DATASET_ROOT / "train"
    val_dir = DATASET_ROOT / "val"

    if not train_dir.exists():
        raise FileNotFoundError(f"Dataset train directory not found at: {train_dir}")

    # Train sampling: cap at 700 to ensure perfect balance with classes having 200-1179
    train_items = scan_split_files(train_dir, max_per_class=700)
    # Val sampling: take up to 400 validation samples per class
    val_items = scan_split_files(val_dir, max_per_class=400)

    print(f"\n[Waste-Model] Total Train Images: {len(train_items)} | Val Images: {len(val_items)}", flush=True)

    train_transform = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    val_transform = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    train_dataset = WasteDataset(train_items, transform=train_transform)
    val_dataset = WasteDataset(val_items, transform=val_transform)

    # Use num_workers=0 to avoid multiprocessing lockup on Windows
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=True)

    # Class balance weights for CrossEntropyLoss
    targets = [item[1] for item in train_items]
    counts = Counter(targets)
    total_samples = len(targets)
    weights = [total_samples / (len(CLASSES) * counts.get(i, 1)) for i in range(len(CLASSES))]
    class_weights = torch.FloatTensor(weights).to(device)

    # Backbone: MobileNetV3-Large for extreme GPU inference speed (<12ms) and high accuracy
    print("[Waste-Model] Initializing MobileNetV3-Large with ImageNet Pretrained Weights...", flush=True)
    weights_enum = models.MobileNet_V3_Large_Weights.DEFAULT
    model = models.mobilenet_v3_large(weights=weights_enum)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.25),
        nn.Linear(in_features, len(CLASSES))
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_acc = 0.0
    best_weights_path = MODELS_DIR / "waste_classifier_best.pth"

    start_time = time.time()
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for batch_idx, (images, labels) in enumerate(train_loader):
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

            if (batch_idx + 1) % 25 == 0 or (batch_idx + 1) == len(train_loader):
                batch_acc = (correct / total) * 100.0
                print(f"  Epoch [{epoch}/{epochs}] Batch [{batch_idx+1}/{len(train_loader)}] Loss: {loss.item():.4f} Running Acc: {batch_acc:.1f}%", flush=True)

        scheduler.step()
        train_loss = running_loss / total
        train_acc = (correct / total) * 100.0

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)

                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_loss = val_loss / val_total
        val_acc = (val_correct / val_total) * 100.0
        epoch_duration = time.time() - epoch_start

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        print(f"\n--> Epoch {epoch:02d}/{epochs:02d} [{epoch_duration:.1f}s] - Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}%", flush=True)

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_weights_path)
            print(f"  >>> Saved New Best Weights: {best_weights_path.name} (Val Acc: {val_acc:.2f}%)", flush=True)

    total_duration = time.time() - start_time
    print(f"\n============================================================", flush=True)
    print(f"[Waste-Model] Training Completed in {total_duration:.1f}s!", flush=True)
    print(f"[Waste-Model] Best Validation Accuracy: {best_val_acc:.2f}%", flush=True)
    print(f"============================================================", flush=True)

    # Final Evaluation & In-Depth Metrics Generation
    print("[Waste-Model] Running In-Depth Validation Assessment...", flush=True)
    model.load_state_dict(torch.load(best_weights_path, map_location=device))
    model.eval()

    all_preds = []
    all_labels = []
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_labels.extend(labels.cpu().numpy().tolist())

    acc = accuracy_score(all_labels, all_preds) * 100.0
    report_dict = classification_report(all_labels, all_preds, target_names=CLASSES, output_dict=True)
    cm = confusion_matrix(all_labels, all_preds)

    # Plot & save confusion matrix
    cm_path = REPORTS_DIR / "waste_classifier_confusion_matrix.png"
    plot_confusion_matrix(cm, CLASSES, cm_path)

    # Plot & save training curves
    plt.figure(figsize=(10, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history["train_loss"], label="Train Loss", marker='o')
    plt.plot(history["val_loss"], label="Val Loss", marker='s')
    plt.title("CrossEntropy Loss Curve")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.5)

    plt.subplot(1, 2, 2)
    plt.plot(history["train_acc"], label="Train Acc %", marker='o')
    plt.plot(history["val_acc"], label="Val Acc %", marker='s')
    plt.title("Accuracy Curve")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy %")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.5)

    plt.tight_layout()
    curves_path = REPORTS_DIR / "waste_classifier_training_curves.png"
    plt.savefig(curves_path, dpi=180)
    plt.close()
    print(f"[Plot] Saved training curves to: {curves_path.name}", flush=True)

    # Bio vs Non-Bio Accuracy calculation
    bio_indices = {CLASS_TO_IDX[c] for c in ["food_waste", "leaf_waste", "paper_waste", "wood_waste"]}
    true_bio = [1 if y in bio_indices else 0 for y in all_labels]
    pred_bio = [1 if y in bio_indices else 0 for y in all_preds]
    degradability_acc = (sum(1 for t, p in zip(true_bio, pred_bio) if t == p) / len(true_bio)) * 100.0

    report_data = {
        "dataset_name": "Waste Segregation & Degradability Dataset",
        "dataset_path": str(DATASET_ROOT),
        "total_train_samples": len(train_items),
        "total_val_samples": len(val_items),
        "model_architecture": "MobileNetV3-Large",
        "input_size": INPUT_SIZE,
        "classes": CLASSES,
        "accuracy": round(acc, 2),
        "degradability_accuracy": round(degradability_acc, 2),
        "best_val_accuracy": round(best_val_acc, 2),
        "classification_report": report_dict,
        "confusion_matrix": cm.tolist(),
        "class_hierarchy": CLASS_HIERARCHY,
        "history": history,
        "device": f"{device} ({gpu_name})",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    report_path = REPORTS_DIR / "waste_classifier_report.json"
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2)
    print(f"[Waste-Model] Report saved: {report_path.name}", flush=True)

    # Metadata for Inference Engine
    meta_data = {
        "model_name": "mobilenet_v3_waste",
        "model_file": "waste_classifier_best.pth",
        "input_size": INPUT_SIZE,
        "mean": IMAGENET_MEAN,
        "std": IMAGENET_STD,
        "classes": CLASSES,
        "accuracy": round(acc, 2),
        "degradability_accuracy": round(degradability_acc, 2),
        "uncertainty_threshold": 0.50,
        "class_hierarchy": CLASS_HIERARCHY,
        "dataset": "archive (2) Waste & Degradability"
    }
    meta_path = MODELS_DIR / "waste_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta_data, f, indent=2)
    print(f"[Waste-Model] Meta saved: {meta_path.name}", flush=True)

    return report_data

if __name__ == "__main__":
    train_waste_model(epochs=3, batch_size=32, lr=2e-4)
