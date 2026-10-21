"""
FoodCovering 2.0 - Deep Learning Training Pipeline (FULL DATASET)
Dataset: C:\\Users\\PRAVEEN\\Downloads\\archive (2)\\Dataset
Hardware: NVIDIA GeForce RTX 3050 A Laptop GPU (CUDA Accelerated)
Classes (8 Granular Categories):
  - Biodegradable: food_waste, leaf_waste, paper_waste, wood_waste
  - Non-Biodegradable: metal_cans, plastic_bottles, plastic_bags, ewaste
"""

import os
import sys
import json
import time
import random
from pathlib import Path
from collections import Counter
from typing import List, Tuple

import torch
import torch.nn as nn
import torch.optim as optim
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

MODELS_DIR.mkdir(parents=True, exist_ok=True)
WASTE_MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

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

class FullWasteDataset(Dataset):
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

def scan_full_split(split_dir: Path) -> List[Tuple[str, int]]:
    """
    Scans ALL images across biodegradable and non_biodegradable folders without any cap.
    """
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    items = []
    class_counts = {c: 0 for c in CLASSES}

    for group in ["biodegradable", "non_biodegradable"]:
        group_dir = split_dir / group
        if not group_dir.exists():
            continue
        for cat_dir in group_dir.iterdir():
            if cat_dir.is_dir() and cat_dir.name in CLASS_TO_IDX:
                cls_name = cat_dir.name
                cls_idx = CLASS_TO_IDX[cls_name]
                for f in cat_dir.glob("*.*"):
                    if f.suffix.lower() in valid_exts:
                        items.append((str(f), cls_idx))
                        class_counts[cls_name] += 1

    print(f"\n[Dataset] Split '{split_dir.name}' Full Image Scan (Total: {len(items)}):", flush=True)
    for c in CLASSES:
        print(f"   - {c:16}: {class_counts[c]} images", flush=True)

    random.seed(42)
    random.shuffle(items)
    return items

def plot_confusion_matrix(cm: np.ndarray, classes: List[str], output_path: Path):
    plt.figure(figsize=(9, 7))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('FoodCovering 2.0 Waste Classification Confusion Matrix (Full Dataset)', fontsize=11, fontweight='bold')
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

    plt.ylabel('Ground Truth Class', fontweight='bold')
    plt.xlabel('Predicted Class', fontweight='bold')
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()
    print(f"[Plot] Saved confusion matrix: {output_path.name}", flush=True)

def train_full_pipeline(stage1_epochs: int = 3, stage2_epochs: int = 2, batch_size: int = 48):
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"

    print("=" * 65, flush=True)
    print(" FOODCOVERING 2.0 - PYTORCH DEEP LEARNING FULL DATASET TRAINING", flush=True)
    print(f" Source:  {DATASET_ROOT}", flush=True)
    print(f" Device:  {device} ({gpu_name})", flush=True)
    print(f" Batches: {batch_size} | Stage-1: {stage1_epochs} epochs | Stage-2: {stage2_epochs} epochs", flush=True)
    print("=" * 65, flush=True)

    train_dir = DATASET_ROOT / "train"
    val_dir = DATASET_ROOT / "val"

    train_items = scan_full_split(train_dir)
    val_items = scan_full_split(val_dir)

    print(f"\n[Dataset] Total Training Images:   {len(train_items)}", flush=True)
    print(f"[Dataset] Total Evaluation Images: {len(val_items)}", flush=True)

    # Class-weighted loss calculation to prevent food_waste domination
    train_labels = [item[1] for item in train_items]
    counts = Counter(train_labels)
    median_count = np.median([counts[i] for i in range(len(CLASSES))])
    raw_weights = [np.sqrt(median_count / max(counts[i], 1)) for i in range(len(CLASSES))]
    clamped_weights = [float(np.clip(w, 0.35, 3.5)) for w in raw_weights]
    class_weights_tensor = torch.FloatTensor(clamped_weights).to(device)

    print("\n[Imbalance] Calculated Class Loss Weights (Smoothed Inverse Frequency):", flush=True)
    for idx, c in enumerate(CLASSES):
        print(f"   {c:16} (count={counts[idx]:5d}) -> weight = {clamped_weights[idx]:.3f}", flush=True)

    # Transforms (Heavy Realistic Augmentation on Train Only)
    train_transform = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomResizedCrop(INPUT_SIZE, scale=(0.80, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=12),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    val_transform = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    train_dataset = FullWasteDataset(train_items, transform=train_transform)
    val_dataset = FullWasteDataset(val_items, transform=val_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=True)

    # Backbone Model Initialization
    print("\n[Model] Loading ImageNet-pretrained MobileNetV3-Large...", flush=True)
    weights = models.MobileNet_V3_Large_Weights.DEFAULT
    model = models.mobilenet_v3_large(weights=weights)

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.25),
        nn.Linear(in_features, len(CLASSES))
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    scaler = torch.amp.GradScaler('cuda') if torch.cuda.is_available() else None

    best_val_f1 = 0.0
    best_val_acc = 0.0
    best_weights_path = WASTE_MODELS_DIR / "waste_model.pth"
    alt_weights_path = MODELS_DIR / "waste_classifier_best.pth"

    total_epochs = stage1_epochs + stage2_epochs
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "val_macro_f1": []}
    overall_start = time.time()

    # ==========================================================
    # STAGE 1: Freeze Backbone, Train Classifier Head
    # ==========================================================
    print("\n" + "=" * 65, flush=True)
    print(" >>> STAGE 1: Freezing Feature Extractor, Training Classifier Head", flush=True)
    print("=" * 65, flush=True)

    for param in model.features.parameters():
        param.requires_grad = False
    for param in model.classifier.parameters():
        param.requires_grad = True

    optimizer_s1 = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=3e-4, weight_decay=1e-4)
    scheduler_s1 = optim.lr_scheduler.CosineAnnealingLR(optimizer_s1, T_max=stage1_epochs)

    current_epoch = 0
    for epoch in range(1, stage1_epochs + 1):
        current_epoch += 1
        ep_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for b_idx, (imgs, lbls) in enumerate(train_loader):
            imgs = imgs.to(device, non_blocking=True)
            lbls = lbls.to(device, non_blocking=True)

            optimizer_s1.zero_grad()
            if scaler:
                with torch.amp.autocast('cuda'):
                    outputs = model(imgs)
                    loss = criterion(outputs, lbls)
                scaler.scale(loss).backward()
                scaler.step(optimizer_s1)
                scaler.update()
            else:
                outputs = model(imgs)
                loss = criterion(outputs, lbls)
                loss.backward()
                optimizer_s1.step()

            running_loss += loss.item() * imgs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == lbls).item()
            total += lbls.size(0)

            if (b_idx + 1) % 60 == 0 or (b_idx + 1) == len(train_loader):
                print(f"  [Stage-1 Epoch {epoch}/{stage1_epochs}] Batch [{b_idx+1}/{len(train_loader)}] Loss: {loss.item():.4f} Running Acc: {(correct/total)*100:.1f}%", flush=True)

        scheduler_s1.step()
        train_loss = running_loss / total
        train_acc = (correct / total) * 100.0

        # Validation
        model.eval()
        val_loss = 0.0
        val_preds_list = []
        val_labels_list = []

        with torch.no_grad():
            for imgs, lbls in val_loader:
                imgs = imgs.to(device, non_blocking=True)
                lbls = lbls.to(device, non_blocking=True)

                if scaler:
                    with torch.amp.autocast('cuda'):
                        outputs = model(imgs)
                        loss = criterion(outputs, lbls)
                else:
                    outputs = model(imgs)
                    loss = criterion(outputs, lbls)

                val_loss += loss.item() * imgs.size(0)
                _, preds = torch.max(outputs, 1)
                val_preds_list.extend(preds.cpu().numpy().tolist())
                val_labels_list.extend(lbls.cpu().numpy().tolist())

        val_loss = val_loss / len(val_dataset)
        val_acc = accuracy_score(val_labels_list, val_preds_list) * 100.0
        _, _, macro_f1, _ = precision_recall_fscore_support(val_labels_list, val_preds_list, average='macro', zero_division=0)
        macro_f1 = macro_f1 * 100.0
        ep_duration = time.time() - ep_start

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["val_macro_f1"].append(macro_f1)

        print(f"==> Epoch {current_epoch:02d}/{total_epochs:02d} (Stage 1) [{ep_duration:.1f}s]: Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}% Macro-F1: {macro_f1:.2f}%", flush=True)

        if macro_f1 > best_val_f1:
            best_val_f1 = macro_f1
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_weights_path)
            torch.save(model.state_dict(), alt_weights_path)
            print(f"  >>> Checkpoint Saved: {best_weights_path.name} (Val Macro-F1: {macro_f1:.2f}%)", flush=True)

    # ==========================================================
    # STAGE 2: Unfreeze Upper Feature Blocks, Fine-Tune
    # ==========================================================
    print("\n" + "=" * 65, flush=True)
    print(" >>> STAGE 2: Unfreezing High-Level Feature Blocks, Fine-Tuning", flush=True)
    print("=" * 65, flush=True)

    # Unfreeze top feature layers (layers 11 to 16)
    for idx, child in enumerate(model.features):
        if idx >= 11:
            for p in child.parameters():
                p.requires_grad = True

    optimizer_s2 = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1.5e-5, weight_decay=1e-4)
    scheduler_s2 = optim.lr_scheduler.CosineAnnealingLR(optimizer_s2, T_max=stage2_epochs)

    for epoch in range(1, stage2_epochs + 1):
        current_epoch += 1
        ep_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for b_idx, (imgs, lbls) in enumerate(train_loader):
            imgs = imgs.to(device, non_blocking=True)
            lbls = lbls.to(device, non_blocking=True)

            optimizer_s2.zero_grad()
            if scaler:
                with torch.amp.autocast('cuda'):
                    outputs = model(imgs)
                    loss = criterion(outputs, lbls)
                scaler.scale(loss).backward()
                scaler.step(optimizer_s2)
                scaler.update()
            else:
                outputs = model(imgs)
                loss = criterion(outputs, lbls)
                loss.backward()
                optimizer_s2.step()

            running_loss += loss.item() * imgs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == lbls).item()
            total += lbls.size(0)

            if (b_idx + 1) % 60 == 0 or (b_idx + 1) == len(train_loader):
                print(f"  [Stage-2 Epoch {epoch}/{stage2_epochs}] Batch [{b_idx+1}/{len(train_loader)}] Loss: {loss.item():.4f} Running Acc: {(correct/total)*100:.1f}%", flush=True)

        scheduler_s2.step()
        train_loss = running_loss / total
        train_acc = (correct / total) * 100.0

        # Validation
        model.eval()
        val_loss = 0.0
        val_preds_list = []
        val_labels_list = []

        with torch.no_grad():
            for imgs, lbls in val_loader:
                imgs = imgs.to(device, non_blocking=True)
                lbls = lbls.to(device, non_blocking=True)

                if scaler:
                    with torch.amp.autocast('cuda'):
                        outputs = model(imgs)
                        loss = criterion(outputs, lbls)
                else:
                    outputs = model(imgs)
                    loss = criterion(outputs, lbls)

                val_loss += loss.item() * imgs.size(0)
                _, preds = torch.max(outputs, 1)
                val_preds_list.extend(preds.cpu().numpy().tolist())
                val_labels_list.extend(lbls.cpu().numpy().tolist())

        val_loss = val_loss / len(val_dataset)
        val_acc = accuracy_score(val_labels_list, val_preds_list) * 100.0
        _, _, macro_f1, _ = precision_recall_fscore_support(val_labels_list, val_preds_list, average='macro', zero_division=0)
        macro_f1 = macro_f1 * 100.0
        ep_duration = time.time() - ep_start

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["val_macro_f1"].append(macro_f1)

        print(f"==> Epoch {current_epoch:02d}/{total_epochs:02d} (Stage 2) [{ep_duration:.1f}s]: Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}% Macro-F1: {macro_f1:.2f}%", flush=True)

        if macro_f1 > best_val_f1:
            best_val_f1 = macro_f1
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_weights_path)
            torch.save(model.state_dict(), alt_weights_path)
            print(f"  >>> Checkpoint Saved: {best_weights_path.name} (Val Macro-F1: {macro_f1:.2f}%)", flush=True)

    total_training_sec = time.time() - overall_start
    print(f"\n[Training] Completed {total_epochs} epochs across {len(train_items)} images in {total_training_sec:.1f}s!", flush=True)
    print(f"[Training] Best Val Acc: {best_val_acc:.2f}% | Best Macro-F1: {best_val_f1:.2f}%", flush=True)

    # Save Label Mappings
    labels_dict = {str(i): c for i, c in enumerate(CLASSES)}
    labels_path = WASTE_MODELS_DIR / "waste_labels.json"
    with open(labels_path, "w", encoding="utf-8") as f:
        json.dump(labels_dict, f, indent=2)
    print(f"[Labels] Saved {labels_path.name}", flush=True)

    # ==========================================================
    # FINAL EVALUATION ON UNTOUCHED EVALUATION SET (1,201 images)
    # ==========================================================
    print("\n" + "=" * 65, flush=True)
    print(" >>> FINAL EVALUATION ON UNTOUCHED EVALUATION SET", flush=True)
    print("=" * 65, flush=True)

    model.load_state_dict(torch.load(best_weights_path, map_location=device))
    model.eval()

    all_preds = []
    all_targets = []
    latencies = []

    dummy_warmup = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE, device=device)
    for _ in range(10):
        _ = model(dummy_warmup)

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

    # Find weakest class by recall
    weakest_class = None
    min_recall = 100.0
    for c in CLASSES:
        r = report_dict[c]["recall"] * 100.0
        if r < min_recall:
            min_recall = r
            weakest_class = c

    # Top confusions
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

    # Save confusion matrix plot
    cm_path1 = REPORTS_DIR / "waste_confusion_matrix.png"
    cm_path2 = REPORTS_DIR / "waste_classifier_confusion_matrix.png"
    plot_confusion_matrix(cm, CLASSES, cm_path1)
    plot_confusion_matrix(cm, CLASSES, cm_path2)

    # Save training curves plot
    plt.figure(figsize=(11, 4.5))
    plt.subplot(1, 2, 1)
    plt.plot(history["train_loss"], label="Train Loss", marker='o', color='#3b82f6')
    plt.plot(history["val_loss"], label="Validation Loss", marker='s', color='#ef4444')
    plt.title("CrossEntropy Loss Curve (Full Dataset)", fontweight='bold')
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.5)

    plt.subplot(1, 2, 2)
    plt.plot(history["train_acc"], label="Train Acc %", marker='o', color='#10b981')
    plt.plot(history["val_acc"], label="Validation Acc %", marker='s', color='#6366f1')
    plt.title("Accuracy Curve (Full Dataset)", fontweight='bold')
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy %")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.5)

    plt.tight_layout()
    curves_path = REPORTS_DIR / "waste_classifier_training_curves.png"
    plt.savefig(curves_path, dpi=200)
    plt.close()
    print(f"[Plot] Saved training curves: {curves_path.name}", flush=True)

    # Build final report JSON
    per_class_summary = {}
    for c in CLASSES:
        per_class_summary[c] = {
            "precision": round(report_dict[c]["precision"] * 100.0, 2),
            "recall": round(report_dict[c]["recall"] * 100.0, 2),
            "f1_score": round(report_dict[c]["f1-score"] * 100.0, 2),
            "support": int(report_dict[c]["support"])
        }

    model_size_mb = round(best_weights_path.stat().st_size / (1024 * 1024), 2)

    final_report = {
        "model_architecture": "MobileNetV3-Large",
        "model_size_mb": model_size_mb,
        "device": f"{device} ({gpu_name})",
        "training_samples": len(train_items),
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

    report_path1 = REPORTS_DIR / "waste_classification_report.json"
    report_path2 = REPORTS_DIR / "waste_classifier_report.json"
    with open(report_path1, "w", encoding="utf-8") as f:
        json.dump(final_report, f, indent=2)
    with open(report_path2, "w", encoding="utf-8") as f:
        json.dump(final_report, f, indent=2)
    print(f"[Report] Saved classification report: {report_path1.name}", flush=True)

    print("\n" + "=" * 65, flush=True)
    print(f" FINAL EMPIRICAL RESULTS (FULL 15,366 DATASET):", flush=True)
    print(f" Test Accuracy:   {final_acc:.2f}%", flush=True)
    print(f" Macro Precision: {prec_macro:.2f}%", flush=True)
    print(f" Macro Recall:    {rec_macro:.2f}%", flush=True)
    print(f" Macro F1 Score:  {f1_macro:.2f}%", flush=True)
    print(f" Weighted F1:     {f1_weighted:.2f}%", flush=True)
    print(f" Weakest Class:   {weakest_class} (Recall: {min_recall:.2f}%)", flush=True)
    print(f" Model Size:      {model_size_mb} MB", flush=True)
    print(f" GPU Latency:     {avg_latency_ms:.2f} ms/image", flush=True)
    print("=" * 65, flush=True)

if __name__ == "__main__":
    train_full_pipeline(stage1_epochs=3, stage2_epochs=2, batch_size=48)
