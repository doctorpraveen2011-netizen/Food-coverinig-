"""
FoodCovering 2.0 - Kaggle Waste Segregation Dataset Inspection Script
Calculates REAL dataset statistics directly from:
C:\\Users\\PRAVEEN\\Downloads\\archive (2)
"""

import os
import sys
import json
from pathlib import Path
from collections import Counter, defaultdict
from PIL import Image

DATASET_ROOT = Path(r"C:\Users\PRAVEEN\Downloads\archive (2)\Dataset")

def inspect_dataset():
    if not DATASET_ROOT.exists():
        print(f"[ERROR] Dataset root not found: {DATASET_ROOT}")
        return

    print("==================================================")
    print(" DATASET ANALYSIS")
    print(f" Source Path: {DATASET_ROOT}")
    print("==================================================")

    splits = ["train", "val"]
    categories = ["biodegradable", "non_biodegradable"]
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    total_images = 0
    corrupted_images = 0
    format_counts = Counter()
    class_distribution = Counter()
    split_counts = defaultdict(int)
    dimensions_sample = []

    classes_found = set()

    for split in splits:
        split_dir = DATASET_ROOT / split
        if not split_dir.exists():
            continue
        for cat in categories:
            cat_dir = split_dir / cat
            if not cat_dir.exists():
                continue
            for sub in cat_dir.iterdir():
                if sub.is_dir():
                    cls_name = sub.name
                    classes_found.add(cls_name)
                    for file_p in sub.glob("*.*"):
                        ext = file_p.suffix.lower()
                        if ext not in valid_extensions:
                            continue
                        total_images += 1
                        format_counts[ext] += 1
                        class_distribution[cls_name] += 1
                        split_counts[split] += 1

                        # Sample dimension checks for every 100th image
                        if total_images % 100 == 1 and len(dimensions_sample) < 50:
                            try:
                                with Image.open(file_p) as img:
                                    img.verify()
                                with Image.open(file_p) as img:
                                    dimensions_sample.append(img.size)
                            except Exception:
                                corrupted_images += 1

    print(f"\nTotal Images:     {total_images}")
    print(f"Classes:          {len(classes_found)}")
    print(f"Corrupted Images: {corrupted_images}")
    print(f"Split Breakdown:  Train = {split_counts['train']} | Val = {split_counts['val']}")
    print(f"Image Formats:    {dict(format_counts)}")

    if dimensions_sample:
        widths, heights = zip(*dimensions_sample)
        print(f"Sample Resolution Min: {min(widths)}x{min(heights)} | Max: {max(widths)}x{max(heights)} | Avg: {int(sum(widths)/len(widths))}x{int(sum(heights)/len(heights))}")

    print("\nClass Distribution:")
    print("--------------------------------------------------")
    for cls_name, count in class_distribution.most_common():
        pct = (count / total_images) * 100 if total_images > 0 else 0
        bar = "#" * int(pct / 2)
        print(f" {cls_name:20}: {count:5d} ({pct:5.1f}%) {bar}")
    print("--------------------------------------------------")

    # Save to json report
    report_data = {
        "dataset_path": str(DATASET_ROOT),
        "total_images": total_images,
        "classes": sorted(list(classes_found)),
        "class_count": len(classes_found),
        "class_distribution": dict(class_distribution),
        "split_counts": dict(split_counts),
        "formats": dict(format_counts),
        "corrupted_count": corrupted_images
    }

    report_path = Path(__file__).parent / "reports" / "dataset_analysis.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2)
    print(f"\n[Saved] Dataset analysis report written to: {report_path}")

if __name__ == "__main__":
    inspect_dataset()
