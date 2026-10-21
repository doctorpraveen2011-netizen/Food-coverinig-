"""
FoodCovering 2.0 - Comprehensive Dataset Audit, Cleaning Verification & Model Evaluation Pipeline
Runs on NVIDIA GeForce RTX 3050 GPU.
Audits the Kaggle archive (2) dataset and evaluates the trained PyTorch Waste Classifier.
"""

import os
import sys
import json
import time
import hashlib
from pathlib import Path
from collections import Counter

import torch
import torch.nn as nn
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
REAL_WORLD_DIR = ML_DIR / "real_world_test"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
REAL_WORLD_DIR.mkdir(parents=True, exist_ok=True)

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
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

def audit_dataset():
    print("="*65)
    print(" PHASE 8 & 9: DATASET AUDIT & INTEGRITY VERIFICATION")
    print("="*65)
    
    audit_stats = {
        "dataset_name": "Kaggle Waste Segregation Dataset (archive 2)",
        "dataset_root": str(DATASET_ROOT),
        "splits": {},
        "total_images": 0,
        "valid_images": 0,
        "corrupted_images": 0,
        "duplicates_detected": 0,
        "classes": CLASSES,
        "class_distribution": {c: {"train": 0, "val": 0, "total": 0} for c in CLASSES},
        "formats": Counter(),
        "resolutions": []
    }

    seen_hashes = set()
    corrupted_files = []
    
    for split in ["train", "val"]:
        split_dir = DATASET_ROOT / split
        audit_stats["splits"][split] = {}
        
        for domain in ["biodegradable", "non_biodegradable"]:
            domain_dir = split_dir / domain
            if not domain_dir.exists():
                continue
            for cls_folder in domain_dir.iterdir():
                if not cls_folder.is_dir() or cls_folder.name not in CLASS_TO_IDX:
                    continue
                cname = cls_folder.name
                files = list(cls_folder.glob("*.*"))
                count = 0
                for f in files:
                    audit_stats["total_images"] += 1
                    audit_stats["formats"][f.suffix.lower()] += 1
                    try:
                        with open(f, "rb") as fp:
                            fbytes = fp.read()
                            h = hashlib.md5(fbytes).hexdigest()
                            if h in seen_hashes:
                                audit_stats["duplicates_detected"] += 1
                            else:
                                seen_hashes.add(h)
                        
                        with Image.open(f) as im:
                            w, h_dim = im.size
                            if len(audit_stats["resolutions"]) < 100:
                                audit_stats["resolutions"].append((w, h_dim))
                            im.verify()
                        audit_stats["valid_images"] += 1
                        count += 1
                    except Exception as e:
                        audit_stats["corrupted_images"] += 1
                        corrupted_files.append({"file": str(f), "error": str(e)})

                audit_stats["splits"][split][cname] = count
                audit_stats["class_distribution"][cname][split] = count
                audit_stats["class_distribution"][cname]["total"] += count

    print(f"\nTotal Images Audited: {audit_stats['total_images']}")
    print(f"Valid Uncorrupted Images: {audit_stats['valid_images']}")
    print(f"Corrupted Images: {audit_stats['corrupted_images']}")
    print(f"Duplicate Files: {audit_stats['duplicates_detected']}")
    print("\nClass Distribution:")
    for c, counts in audit_stats["class_distribution"].items():
        print(f"  {c:<18}: Train={counts['train']:<5} | Val={counts['val']:<4} | Total={counts['total']}")

    report_path = REPORTS_DIR / "dataset_cleaning_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "dataset_name": audit_stats["dataset_name"],
            "dataset_root": audit_stats["dataset_root"],
            "total_images": audit_stats["total_images"],
            "valid_images": audit_stats["valid_images"],
            "corrupted_images": audit_stats["corrupted_images"],
            "duplicates_detected": audit_stats["duplicates_detected"],
            "class_distribution": audit_stats["class_distribution"],
            "formats": dict(audit_stats["formats"])
        }, f, indent=2)
    print(f"\n[Audit] Saved report to: {report_path}")
    return audit_stats

class WasteEvalDataset(Dataset):
    def __init__(self, file_label_pairs, transform=None):
        self.samples = file_label_pairs
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            with open(path, "rb") as f:
                img = Image.open(f).convert("RGB")
        except Exception:
            img = Image.new("RGB", (INPUT_SIZE, INPUT_SIZE), (128, 128, 128))
        if self.transform:
            img = self.transform(img)
        return img, label

def load_eval_samples(split_dir: Path):
    samples = []
    for domain in ["biodegradable", "non_biodegradable"]:
        d_dir = split_dir / domain
        if not d_dir.exists():
            continue
        for c_dir in d_dir.iterdir():
            if c_dir.is_dir() and c_dir.name in CLASS_TO_IDX:
                lbl = CLASS_TO_IDX[c_dir.name]
                for f in c_dir.glob("*.*"):
                    if f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
                        samples.append((f, lbl))
    return samples

def evaluate_model():
    print("\n" + "="*65)
    print(" PHASE 18 & 19: REAL TEST EVALUATION ON UNTOUCHED EVALUATION SET")
    print("="*65)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    print(f"[Eval] Compute Device: {device} ({gpu_name})")

    # Load Model Weights
    weights_path = MODELS_DIR / "waste" / "waste_model.pth"
    if not weights_path.exists():
        weights_path = MODELS_DIR / "waste_classifier_best.pth"
    
    file_size_mb = weights_path.stat().st_size / (1024 * 1024)
    print(f"[Eval] Loaded Model Weights: {weights_path.name} ({file_size_mb:.2f} MB)")

    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.25),
        nn.Linear(in_features, len(CLASSES))
    )
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model = model.to(device)
    model.eval()

    val_dir = DATASET_ROOT / "val"
    val_samples = load_eval_samples(val_dir)
    print(f"[Eval] Total Untouched Evaluation Samples: {len(val_samples)}")

    # Preprocessing strictly identical to inference standard: Resize(256) -> CenterCrop(224)
    eval_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(INPUT_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    val_dataset = WasteEvalDataset(val_samples, transform=eval_transform)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=0)

    all_preds = []
    all_labels = []
    latencies = []

    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            t0 = time.perf_counter()
            outputs = model(images)
            if device.type == "cuda":
                torch.cuda.synchronize()
            t1 = time.perf_counter()
            latencies.append((t1 - t0) / images.size(0))

            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(probs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_labels.extend(labels.cpu().numpy().tolist())

    acc = accuracy_score(all_labels, all_preds) * 100.0
    report = classification_report(all_labels, all_preds, target_names=CLASSES, output_dict=True)
    cm = confusion_matrix(all_labels, all_preds)

    avg_latency_ms = (sum(latencies) / len(latencies)) * 1000.0

    print(f"\n[Test Result] Accuracy       : {acc:.2f}%")
    print(f"[Test Result] Macro Precision: {report['macro avg']['precision']*100:.2f}%")
    print(f"[Test Result] Macro Recall   : {report['macro avg']['recall']*100:.2f}%")
    print(f"[Test Result] Macro F1       : {report['macro avg']['f1-score']*100:.2f}%")
    print(f"[Test Result] Weighted F1    : {report['weighted avg']['f1-score']*100:.2f}%")
    print(f"[Test Result] Avg Latency/Img: {avg_latency_ms:.2f} ms")

    # Per-class recall analysis to identify weakest class
    per_class_recalls = {c: report[c]['recall'] for c in CLASSES}
    weakest_class = min(per_class_recalls, key=per_class_recalls.get)
    print(f"[Analysis] Weakest Class: {weakest_class} (Recall: {per_class_recalls[weakest_class]*100:.1f}%)")

    # Find most confused classes
    confused_pairs = []
    for i in range(len(CLASSES)):
        for j in range(len(CLASSES)):
            if i != j and cm[i][j] > 0:
                confused_pairs.append((CLASSES[i], CLASSES[j], int(cm[i][j])))
    confused_pairs.sort(key=lambda x: x[2], reverse=True)

    print("\nMost Common Confusions:")
    for true_c, pred_c, count in confused_pairs[:5]:
        print(f"  {true_c} misclassified as {pred_c}: {count} times")

    # Plot Confusion Matrix
    fig, ax = plt.subplots(figsize=(10, 8))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(xticks=np.arange(cm.shape[1]),
           yticks=np.arange(cm.shape[0]),
           xticklabels=CLASSES, yticklabels=CLASSES,
           title='FoodCovering PyTorch Waste Classifier - Confusion Matrix',
           ylabel='True Class',
           xlabel='Predicted Class')
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")
    fig.tight_layout()
    cm_path = REPORTS_DIR / "waste_confusion_matrix.png"
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"[Report] Saved Confusion Matrix to: {cm_path}")

    # Save detailed classification report
    full_report = {
        "model_architecture": "MobileNetV3-Large",
        "model_size_mb": round(file_size_mb, 2),
        "device": f"{device} ({gpu_name})",
        "inference_latency_ms": round(avg_latency_ms, 2),
        "test_samples": len(val_samples),
        "test_accuracy": round(acc, 2),
        "macro_precision": round(report['macro avg']['precision'] * 100, 2),
        "macro_recall": round(report['macro avg']['recall'] * 100, 2),
        "macro_f1": round(report['macro avg']['f1-score'] * 100, 2),
        "weighted_f1": round(report['weighted avg']['f1-score'] * 100, 2),
        "weakest_class": weakest_class,
        "weakest_class_recall": round(per_class_recalls[weakest_class] * 100, 2),
        "top_confusions": [
            {"true_class": t, "predicted_class": p, "misclassified_count": c}
            for t, p, c in confused_pairs[:5]
        ],
        "per_class_metrics": {
            c: {
                "precision": round(report[c]["precision"] * 100, 2),
                "recall": round(report[c]["recall"] * 100, 2),
                "f1_score": round(report[c]["f1-score"] * 100, 2),
                "support": int(report[c]["support"])
            }
            for c in CLASSES
        },
        "confusion_matrix": cm.tolist()
    }

    report_file = REPORTS_DIR / "waste_classification_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2)
    print(f"[Report] Saved Classification Report to: {report_file}")

    return full_report

if __name__ == "__main__":
    audit_data = audit_dataset()
    eval_data = evaluate_model()
    print("\n[Complete] Dataset audit and model evaluation finished successfully.")
