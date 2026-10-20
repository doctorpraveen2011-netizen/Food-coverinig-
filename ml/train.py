"""
FoodCovering 2.0 - Deep Learning Training & Evaluation Engine
Features:
- Transfer learning with EfficientNet-B0, MobileNetV3-Large, and ResNet50.
- Strict Two-Stage Training (Head warmup -> Fine-tune later layers).
- Class-balanced weighted CrossEntropyLoss.
- Early Stopping, Model Checkpoint, ReduceLROnPlateau.
- Comprehensive Test Set Evaluation with Confusion Matrix, Per-class Precision/Recall/F1.
- Food Safety False-Safe error analysis (Spoiled predicted as Fresh).
- Training Curves & Confusion Matrix plot generation.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score

ML_DIR = Path(__file__).parent
DATA_DIR = ML_DIR / "data"
MODELS_DIR = ML_DIR / "models"
REPORTS_DIR = ML_DIR / "reports"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ImageNet normalization standard
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

def get_data_loaders(batch_size=32, num_workers=0):
    train_transforms = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    val_test_transforms = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
    ])

    train_dataset = datasets.ImageFolder(DATA_DIR / "train", transform=train_transforms)
    val_dataset = datasets.ImageFolder(DATA_DIR / "val", transform=val_test_transforms)
    test_dataset = datasets.ImageFolder(DATA_DIR / "test", transform=val_test_transforms)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)

    # Calculate class weights for imbalanced handling
    targets = [s[1] for s in train_dataset.samples]
    class_counts = np.bincount(targets)
    total_samples = len(targets)
    n_classes = len(class_counts)
    class_weights = total_samples / (n_classes * class_counts.astype(np.float32))
    class_weights = torch.FloatTensor(class_weights)

    return train_loader, val_loader, test_loader, train_dataset.classes, class_weights

def build_model(model_name: str, num_classes: int):
    if model_name == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.DEFAULT
        model = models.efficientnet_b0(weights=weights)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, num_classes)
        )
    elif model_name == "mobilenet_v3":
        weights = models.MobileNet_V3_Large_Weights.DEFAULT
        model = models.mobilenet_v3_large(weights=weights)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    elif model_name == "resnet50":
        weights = models.ResNet50_Weights.DEFAULT
        model = models.resnet50(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes)
        )
    else:
        raise ValueError(f"Unsupported model architecture: {model_name}")

    return model

def freeze_backbone(model: nn.Module, model_name: str, freeze: bool = True):
    if model_name == "efficientnet_b0":
        for param in model.features.parameters():
            param.requires_grad = not freeze
    elif model_name == "mobilenet_v3":
        for param in model.features.parameters():
            param.requires_grad = not freeze
    elif model_name == "resnet50":
        for name, param in model.named_parameters():
            if not name.startswith("fc"):
                param.requires_grad = not freeze

def unfreeze_later_layers(model: nn.Module, model_name: str):
    """
    Carefully unfreeze only top layers for Phase 2 fine-tuning.
    Avoids catastrophic forgetting of pretrained ImageNet features.
    """
    if model_name == "efficientnet_b0":
        # Unfreeze blocks 6, 7 and conv_head
        for idx in range(6, len(model.features)):
            for param in model.features[idx].parameters():
                param.requires_grad = True
    elif model_name == "mobilenet_v3":
        for idx in range(12, len(model.features)):
            for param in model.features[idx].parameters():
                param.requires_grad = True
    elif model_name == "resnet50":
        for param in model.layer4.parameters():
            param.requires_grad = True

def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for inputs, labels in dataloader:
        inputs = inputs.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data).item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc

def evaluate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs = inputs.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            outputs = model(inputs)
            loss = criterion(outputs, labels)

            probs = torch.softmax(outputs, dim=1)
            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)

            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc, np.array(all_preds), np.array(all_labels), np.array(all_probs)

def plot_training_curves(history, model_name):
    epochs = range(1, len(history['train_acc']) + 1)
    
    plt.figure(figsize=(14, 5))
    
    # Accuracy plot
    plt.subplot(1, 2, 1)
    plt.plot(epochs, history['train_acc'], 'b-o', label='Training Accuracy', linewidth=2)
    plt.plot(epochs, history['val_acc'], 'g-s', label='Validation Accuracy', linewidth=2)
    plt.title(f'{model_name} - Accuracy Progression')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend()

    # Loss plot
    plt.subplot(1, 2, 2)
    plt.plot(epochs, history['train_loss'], 'r-o', label='Training Loss', linewidth=2)
    plt.plot(epochs, history['val_loss'], 'orange', linestyle='--', marker='s', label='Validation Loss', linewidth=2)
    plt.title(f'{model_name} - Loss Progression')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend()

    chart_path = REPORTS_DIR / f"{model_name}_training_curves.png"
    plt.tight_layout()
    plt.savefig(chart_path, dpi=200)
    plt.close()
    print(f"[Training] Saved training curves: {chart_path.name}")

def plot_confusion_matrix(cm, classes, model_name):
    plt.figure(figsize=(8, 7))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title(f'Confusion Matrix: {model_name}', fontsize=12, fontweight='bold')
    plt.colorbar()
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, rotation=35, ha='right', fontsize=9)
    plt.yticks(tick_marks, classes, fontsize=9)

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     ha="center", va="center",
                     color="white" if cm[i, j] > thresh else "black",
                     fontweight='bold')

    plt.ylabel('True Class', fontsize=10)
    plt.xlabel('Predicted Class', fontsize=10)
    plt.tight_layout()
    cm_path = REPORTS_DIR / f"{model_name}_confusion_matrix.png"
    plt.savefig(cm_path, dpi=200)
    plt.close()
    print(f"[Evaluation] Saved confusion matrix: {cm_path.name}")

def run_training(model_name="efficientnet_b0", phase1_epochs=4, phase2_epochs=6, batch_size=32):
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"\n=======================================================")
    print(f" TRAINING MODEL: {model_name} on {device}")
    print(f"=======================================================")

    train_loader, val_loader, test_loader, classes, class_weights = get_data_loaders(batch_size=batch_size)
    num_classes = len(classes)
    print(f"[Data] Loaded classes: {classes}")
    print(f"[Data] Training samples: {len(train_loader.dataset)} | Val: {len(val_loader.dataset)} | Test: {len(test_loader.dataset)}")
    print(f"[Data] Computed class weights: {class_weights.numpy().round(3)}")

    class_weights = class_weights.to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    model = build_model(model_name, num_classes).to(device)

    history = {
        'train_acc': [], 'train_loss': [],
        'val_acc': [], 'val_loss': []
    }

    best_val_acc = 0.0
    best_model_path = MODELS_DIR / f"{model_name}_best.pth"
    best_epoch = 0

    # -----------------------------------------------------------------
    # PHASE 1: Warmup Classifier Head (Frozen Backbone)
    # -----------------------------------------------------------------
    print(f"\n>>> PHASE 1: Classifier Head Warmup ({phase1_epochs} epochs, lr=1e-3)")
    freeze_backbone(model, model_name, freeze=True)
    optimizer_p1 = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=1e-4)

    for epoch in range(1, phase1_epochs + 1):
        t0 = time.time()
        t_loss, t_acc = train_epoch(model, train_loader, criterion, optimizer_p1, device)
        v_loss, v_acc, _, _, _ = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        history['train_acc'].append(t_acc)
        history['train_loss'].append(t_loss)
        history['val_acc'].append(v_acc)
        history['val_loss'].append(v_loss)

        print(f"P1 Epoch [{epoch}/{phase1_epochs}] ({elapsed:.1f}s) - Train Loss: {t_loss:.4f}, Acc: {t_acc*100:.2f}% | Val Loss: {v_loss:.4f}, Acc: {v_acc*100:.2f}%")

        if v_acc > best_val_acc:
            best_val_acc = v_acc
            best_epoch = epoch
            torch.save(model.state_dict(), best_model_path)
            print(f"  --> Saved new best checkpoint (Val Acc: {v_acc*100:.2f}%)")

    # -----------------------------------------------------------------
    # PHASE 2: Fine-Tuning Top Layers (Small learning rate)
    # -----------------------------------------------------------------
    print(f"\n>>> PHASE 2: Fine-Tuning Top Layers ({phase2_epochs} epochs, lr=1e-4 with ReduceLROnPlateau)")
    unfreeze_later_layers(model, model_name)
    optimizer_p2 = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer_p2, mode='min', factor=0.5, patience=2)

    total_epochs = phase1_epochs + phase2_epochs
    patience_counter = 0

    for epoch in range(phase1_epochs + 1, total_epochs + 1):
        t0 = time.time()
        t_loss, t_acc = train_epoch(model, train_loader, criterion, optimizer_p2, device)
        v_loss, v_acc, _, _, _ = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        scheduler.step(v_loss)
        current_lr = optimizer_p2.param_groups[0]['lr']

        history['train_acc'].append(t_acc)
        history['train_loss'].append(t_loss)
        history['val_acc'].append(v_acc)
        history['val_loss'].append(v_loss)

        print(f"P2 Epoch [{epoch}/{total_epochs}] ({elapsed:.1f}s, lr={current_lr:.1e}) - Train Loss: {t_loss:.4f}, Acc: {t_acc*100:.2f}% | Val Loss: {v_loss:.4f}, Acc: {v_acc*100:.2f}%")

        if v_acc > best_val_acc:
            best_val_acc = v_acc
            best_epoch = epoch
            patience_counter = 0
            torch.save(model.state_dict(), best_model_path)
            print(f"  --> Saved new best checkpoint (Val Acc: {v_acc*100:.2f}%)")
        else:
            patience_counter += 1
            if patience_counter >= 4:
                print(f"[Training] Early stopping triggered at epoch {epoch} (no val improvement for 4 epochs).")
                break

    # Save training graphs
    plot_training_curves(history, model_name)

    # -----------------------------------------------------------------
    # PHASE 3: EVALUATION ON UNTOUCHED TEST SET
    # -----------------------------------------------------------------
    print(f"\n=======================================================")
    print(f" EVALUATING BEST CHECKPOINT ON UNTOUCHED TEST SET")
    print(f"=======================================================")
    model.load_state_dict(torch.load(best_model_path))
    test_loss, test_acc, test_preds, test_labels, test_probs = evaluate(model, test_loader, criterion, device)

    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(test_labels, test_preds, average='macro', zero_division=0)
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(test_labels, test_preds, average='weighted', zero_division=0)
    
    cm = confusion_matrix(test_labels, test_preds)
    plot_confusion_matrix(cm, classes, model_name)

    # Per-Class detailed evaluation
    prec_cls, rec_cls, f1_cls, supp_cls = precision_recall_fscore_support(test_labels, test_preds, average=None, zero_division=0)
    
    print("\n" + "="*70)
    print(f"     FINAL TEST PERFORMANCE: {model_name.upper()}")
    print("="*70)
    print(f"Test Accuracy    : {test_acc*100:.2f}%")
    print(f"Macro Precision  : {prec_macro*100:.2f}%")
    print(f"Macro Recall     : {rec_macro*100:.2f}%")
    print(f"Macro F1-Score   : {f1_macro*100:.2f}%")
    print(f"Weighted F1-Score: {f1_weighted*100:.2f}%")
    print(f"Best Epoch       : {best_epoch}")
    print("-" * 70)
    print(f"{'Class':<18} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 70)
    for idx, c in enumerate(classes):
        print(f"{c:<18} | {prec_cls[idx]*100:>8.2f}% | {rec_cls[idx]*100:>8.2f}% | {f1_cls[idx]*100:>8.2f}% | {supp_cls[idx]:<8}")
    print("-" * 70)

    # Food Safety Priority Check: Spoiled -> Fresh error analysis
    # Identify indices of spoiled vs fresh classes
    spoiled_indices = [i for i, c in enumerate(classes) if 'rotten' in c or 'spoiled' in c]
    fresh_indices = [i for i, c in enumerate(classes) if 'fresh' in c]

    false_fresh_errors = 0
    total_spoiled_test = 0
    for true_idx in spoiled_indices:
        for pred_idx in fresh_indices:
            false_fresh_errors += cm[true_idx, pred_idx]
        total_spoiled_test += cm[true_idx].sum()

    false_fresh_rate = (false_fresh_errors / total_spoiled_test) if total_spoiled_test > 0 else 0.0

    print(f"FOOD SAFETY CRITICAL METRIC (False Fresh / Hazard Rate):")
    print(f"Spoiled items wrongly classified as Fresh: {false_fresh_errors} / {total_spoiled_test} ({false_fresh_rate*100:.2f}%)")
    print("="*70 + "\n")

    # Save complete report json
    report_data = {
        "model_architecture": model_name,
        "best_epoch": int(best_epoch),
        "test_accuracy": float(test_acc),
        "macro_precision": float(prec_macro),
        "macro_recall": float(rec_macro),
        "macro_f1": float(f1_macro),
        "weighted_f1": float(f1_weighted),
        "test_loss": float(test_loss),
        "false_fresh_errors": int(false_fresh_errors),
        "total_spoiled_tested": int(total_spoiled_test),
        "false_fresh_rate": float(false_fresh_rate),
        "classes": classes,
        "per_class": {
            classes[i]: {
                "precision": float(prec_cls[i]),
                "recall": float(rec_cls[i]),
                "f1_score": float(f1_cls[i]),
                "support": int(supp_cls[i])
            } for i in range(len(classes))
        },
        "confusion_matrix": cm.tolist(),
        "model_file": str(best_model_path.name),
        "model_size_mb": float(best_model_path.stat().st_size / (1024*1024))
    }

    report_file = REPORTS_DIR / f"{model_name}_report.json"
    with open(report_file, "w") as f:
        json.dump(report_data, f, indent=2)

    # Save model metadata for production inference
    meta = {
        "model_name": model_name,
        "input_size": INPUT_SIZE,
        "mean": IMAGENET_MEAN,
        "std": IMAGENET_STD,
        "classes": classes,
        "uncertainty_threshold": 0.60,
        "supported_foods": ["Apple", "Banana", "Orange", "Produce"],
        "model_file": f"{model_name}_best.pth",
        "test_accuracy": round(float(test_acc) * 100, 2),
        "false_fresh_rate": round(float(false_fresh_rate) * 100, 2)
    }
    with open(MODELS_DIR / "model_meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    freshness_dir = MODELS_DIR / "freshness"
    freshness_dir.mkdir(parents=True, exist_ok=True)
    with open(freshness_dir / "freshness_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    with open(freshness_dir / "freshness_labels.json", "w") as f:
        json.dump(classes, f, indent=2)

    import shutil
    shutil.copyfile(best_model_path, freshness_dir / "freshness_model.pth")

    print(f"[Report] Saved evaluation results to: {report_file}")
    return report_data

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="efficientnet_b0", choices=["efficientnet_b0", "mobilenet_v3", "resnet50"])
    parser.add_argument("--p1_epochs", type=int, default=3)
    parser.add_argument("--p2_epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=32)
    args = parser.parse_args()

    run_training(
        model_name=args.model,
        phase1_epochs=args.p1_epochs,
        phase2_epochs=args.p2_epochs,
        batch_size=args.batch_size
    )
