"""
FoodCovering 2.0 - Fast Evaluation on Untouched Evaluation Split
Loads the newly trained waste_model.pth (trained on full 14,165 images),
evaluates on all 1,201 untouched test samples, and saves full reports.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import List, Tuple

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

DATASET_ROOT = Path(r"C:\Users\PRAVEEN\Downloads\archive (2)\Dataset")
ML_DIR = Path(__file__).parent
MODELS_DIR = ML_DIR / "models"
WASTE_MODELS_DIR = MODELS_DIR / "waste"
REPORTS_DIR = ML_DIR / "reports"

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

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

class EvalDataset(Dataset):
    def __init__(self, items: List[Tuple[str, int]], transform=None):
        self.items = items
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

def scan_eval_items(val_dir: Path) -> List[Tuple[str, int]]:
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    items = []
    for group in ["biodegradable", "non_biodegradable"]:
        group_dir = val_dir / group
        if not group_dir.exists():
            continue
        for cat_dir in group_dir.iterdir():
            if cat_dir.is_dir() and cat_dir.name in CLASS_TO_IDX:
                cls_idx = CLASS_TO_IDX[cat_dir.name]
                for f in cat_dir.glob("*.*"):
                    if f.suffix.lower() in valid_exts:
                        items.append((str(f), cls_idx))
    return items

def plot_cm(cm: np.ndarray, classes: List[str], output_path: Path):
    plt.figure(figsize=(9, 7))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('FoodCovering 2.0 - Final Waste Confusion Matrix (Full Dataset)', fontsize=11, fontweight='bold')
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

    plt.ylabel('Ground Truth', fontweight='bold')
    plt.xlabel('Predicted Class', fontweight='bold')
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()

def main():
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    print(f"[Eval] Evaluating newly trained model on {device} ({gpu_name})...")

    weights_path = WASTE_MODELS_DIR / "waste_model.pth"
    if not weights_path.exists():
        weights_path = MODELS_DIR / "waste_classifier_best.pth"

    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.25),
        nn.Linear(in_features, len(CLASSES))
    )
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model = model.to(device)
    model.eval()

    val_items = scan_eval_items(DATASET_ROOT / "val")
    print(f"[Eval] Loaded {len(val_items)} untouched evaluation images across 8 classes.")

    val_transform = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    val_dataset = EvalDataset(val_items, transform=val_transform)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=0)

    all_preds = []
    all_targets = []
    latencies = []

    # Warmup
    dummy = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE, device=device)
    for _ in range(10):
        _ = model(dummy)

    with torch.no_grad():
        for imgs, lbls in val_loader:
            imgs = imgs.to(device)
            t0 = time.time()
            outputs = model(imgs)
            latencies.append((time.time() - t0) / imgs.size(0))
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(lbls.numpy().tolist())

    avg_latency_ms = float(np.mean(latencies) * 1000.0)
    final_acc = float(accuracy_score(all_targets, all_preds) * 100.0)
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(all_targets, all_preds, average='macro', zero_division=0)
    _, _, f1_weighted, _ = precision_recall_fscore_support(all_targets, all_preds, average='weighted', zero_division=0)

    prec_macro = float(prec_macro * 100.0)
    rec_macro = float(rec_macro * 100.0)
    f1_macro = float(f1_macro * 100.0)
    f1_weighted = float(f1_weighted * 100.0)

    report_dict = classification_report(all_targets, all_preds, target_names=CLASSES, output_dict=True, zero_division=0)
    cm = confusion_matrix(all_targets, all_preds)

    weakest_class = None
    min_recall = 100.0
    for c in CLASSES:
        r = report_dict[c]["recall"] * 100.0
        if r < min_recall:
            min_recall = r
            weakest_class = c

    confusions = []
    for i in range(len(CLASSES)):
        for j in range(len(CLASSES)):
            if i != j and cm[i, j] > 0:
                confusions.append({
                    "true_class": CLASSES[i],
                    "predicted_class": CLASSES[j],
                    "misclassified_count": int(cm[i, j])
                })
    confusions.sort(key=lambda x: x["misclassified_count"], reverse=True)

    cm_path1 = REPORTS_DIR / "waste_confusion_matrix.png"
    cm_path2 = REPORTS_DIR / "waste_classifier_confusion_matrix.png"
    plot_cm(cm, CLASSES, cm_path1)
    plot_cm(cm, CLASSES, cm_path2)

    per_class_summary = {}
    for c in CLASSES:
        per_class_summary[c] = {
            "precision": round(report_dict[c]["precision"] * 100.0, 2),
            "recall": round(report_dict[c]["recall"] * 100.0, 2),
            "f1_score": round(report_dict[c]["f1-score"] * 100.0, 2),
            "support": int(report_dict[c]["support"])
        }

    model_size_mb = round(weights_path.stat().st_size / (1024 * 1024), 2)

    final_report = {
        "model_architecture": "MobileNetV3-Large",
        "model_size_mb": model_size_mb,
        "device": f"{device} ({gpu_name})",
        "training_samples": 14165,
        "test_samples": len(val_items),
        "inference_latency_ms": round(avg_latency_ms, 2),
        "test_accuracy": round(final_acc, 2),
        "macro_precision": round(prec_macro, 2),
        "macro_recall": round(rec_macro, 2),
        "macro_f1": round(f1_macro, 2),
        "weighted_f1": round(f1_weighted, 2),
        "weakest_class": weakest_class,
        "weakest_class_recall": round(min_recall, 2),
        "top_confusions": confusions[:5],
        "per_class_metrics": per_class_summary,
        "confusion_matrix": cm.tolist()
    }

    with open(REPORTS_DIR / "waste_classification_report.json", "w", encoding="utf-8") as f:
        json.dump(final_report, f, indent=2)
    with open(REPORTS_DIR / "waste_classifier_report.json", "w", encoding="utf-8") as f:
        json.dump(final_report, f, indent=2)

    print("=" * 65)
    print(f"EMPIRICAL RESULTS (TRAINED ON FULL 14,165 DATASET):")
    print(f"Test Accuracy:   {final_acc:.2f}%")
    print(f"Macro Precision: {prec_macro:.2f}%")
    print(f"Macro Recall:    {rec_macro:.2f}%")
    print(f"Macro F1:        {f1_macro:.2f}%")
    print(f"Weighted F1:     {f1_weighted:.2f}%")
    print(f"Weakest Class:   {weakest_class} (Recall: {min_recall:.2f}%)")
    print(f"Inference Time:  {avg_latency_ms:.2f} ms/image")
    print("=" * 65)

if __name__ == "__main__":
    main()
