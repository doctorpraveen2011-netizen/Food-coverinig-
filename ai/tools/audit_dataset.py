"""
FoodCovering 2.0 - Standalone Real Dataset Auditor
Audits the Kaggle Waste Segregation Dataset (archive 2) directly from disk.
Inspects total images, classes, image formats, dimensions, corrupted files,
duplicates (MD5 hash), and real class balance.
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from collections import Counter, defaultdict
from PIL import Image

# Canonical dataset path on user's machine
DATASET_ROOT = Path(r"C:\Users\PRAVEEN\Downloads\archive (2)\Dataset")
REPORT_OUTPUT = Path(__file__).resolve().parent.parent.parent / "ml" / "reports" / "dataset_cleaning_report.json"

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

DOMAINS = ["biodegradable", "non_biodegradable"]
SPLITS = ["train", "val"]
VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

def audit_waste_dataset():
    if not DATASET_ROOT.exists():
        print(f"[ERROR] Dataset directory not found at: {DATASET_ROOT}")
        print("Please verify the archive (2) dataset location.")
        return None

    print("=" * 60)
    print(" WASTE DATASET AUDIT")
    print(f" Source: {DATASET_ROOT}")
    print("=" * 60)

    total_images = 0
    valid_images = 0
    corrupted_images = 0
    duplicate_images = 0
    format_counts = Counter()
    class_counts = Counter()
    split_counts = defaultdict(int)
    dimensions_sample = []
    seen_hashes = set()
    corrupted_files = []

    for split in SPLITS:
        split_dir = DATASET_ROOT / split
        if not split_dir.exists():
            continue

        for domain in DOMAINS:
            domain_dir = split_dir / domain
            if not domain_dir.exists():
                continue

            for class_dir in domain_dir.iterdir():
                if not class_dir.is_dir():
                    continue

                class_name = class_dir.name
                for file_path in class_dir.glob("*.*"):
                    ext = file_path.suffix.lower()
                    if ext not in VALID_EXTENSIONS:
                        continue

                    total_images += 1
                    format_counts[ext] += 1
                    split_counts[split] += 1

                    # Hash check for exact duplicate detection
                    try:
                        with open(file_path, "rb") as f:
                            file_bytes = f.read()
                            file_hash = hashlib.md5(file_bytes).hexdigest()
                            if file_hash in seen_hashes:
                                duplicate_images += 1
                            else:
                                seen_hashes.add(file_hash)
                    except Exception:
                        pass

                    # Image integrity & dimension check
                    try:
                        with Image.open(file_path) as img:
                            img.verify()
                        with Image.open(file_path) as img:
                            if len(dimensions_sample) < 100:
                                dimensions_sample.append(img.size)
                        valid_images += 1
                        class_counts[class_name] += 1
                    except Exception as err:
                        corrupted_images += 1
                        corrupted_files.append({"file": str(file_path), "error": str(err)})

    print(f"\nTotal images:      {total_images}")
    print(f"Valid images:      {valid_images}")
    print(f"Classes:           {len(class_counts)}")
    print(f"Corrupted files:   {corrupted_images}")
    print(f"Duplicate files:   {duplicate_images}")
    print(f"Split breakdown:   Train = {split_counts['train']} | Val = {split_counts['val']}")
    print(f"Image formats:     {dict(format_counts)}")

    if dimensions_sample:
        widths, heights = zip(*dimensions_sample)
        print(f"Dimensions Sample: Min={min(widths)}x{min(heights)} | Max={max(widths)}x{max(heights)} | Avg={int(sum(widths)/len(widths))}x{int(sum(heights)/len(heights))}")

    print("\nClass Distribution:")
    print("-" * 50)
    for class_name, count in class_counts.most_common():
        pct = (count / total_images) * 100 if total_images > 0 else 0
        print(f" {class_name:<20}: {count:5d} ({pct:5.1f}%)")
    print("-" * 50)

    # Class weights calculation for CrossEntropyLoss balancing
    max_count = max(class_counts.values()) if class_counts else 1
    class_weights = {
        cls: round(max_count / max(count, 1), 3)
        for cls, count in class_counts.items()
    }
    print("\nCalculated Class Weights (for loss balancing):")
    for cls, weight in class_weights.items():
        print(f"  {cls:<18}: weight={weight}")

    report = {
        "dataset_name": "Kaggle Waste Segregation Image Dataset",
        "dataset_root": str(DATASET_ROOT),
        "total_images": total_images,
        "valid_images": valid_images,
        "classes_count": len(class_counts),
        "classes": sorted(list(class_counts.keys())),
        "class_distribution": dict(class_counts),
        "class_weights": class_weights,
        "split_counts": dict(split_counts),
        "formats": dict(format_counts),
        "corrupted_count": corrupted_images,
        "duplicate_count": duplicate_images,
        "corrupted_files": corrupted_files
    }

    REPORT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n[Report Saved] -> {REPORT_OUTPUT}")
    return report

if __name__ == "__main__":
    audit_waste_dataset()
