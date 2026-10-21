"""
FoodCovering 2.0 - Real-World Phone & Camera Validation Suite
Tests specimens stored in ml/real_world_test/
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from infer import router

REAL_WORLD_DIR = Path(__file__).parent / "real_world_test"

def run_real_world_tests():
    print("="*65)
    print(" PHASE 38 & 39: REAL-WORLD CAMERA SPECIMEN VALIDATION")
    print("="*65)

    test_specs = [
        {
            "name": "TEST 1: Rotten Orange (User Upload with Penicillium Mold)",
            "file": "test_rotten_orange.png",
            "expected_waste_group": "Biodegradable",
            "expected_item": "Spoiled Orange",
            "mode": "auto"
        },
        {
            "name": "TEST 2: Aluminum Metal Can",
            "file": "test_metal_can.jpg",
            "expected_waste_group": "Non-Biodegradable",
            "expected_item": "Metal Cans & Tins",
            "mode": "waste"
        },
        {
            "name": "TEST 3: PET Plastic Bottle",
            "file": "test_plastic_bottle.jpg",
            "expected_waste_group": "Non-Biodegradable",
            "expected_item": "PET Plastic Beverage Bottles",
            "mode": "waste"
        },
        {
            "name": "TEST 4: Corrugated Cardboard / Paper Scrap",
            "file": "test_paper_waste.jpg",
            "expected_waste_group": "Biodegradable Recyclable",
            "expected_item": "Corrugated Cardboard & Mixed Paper",
            "mode": "waste"
        },
        {
            "name": "TEST 5: Garden / Leaf Waste",
            "file": "test_leaf_waste.jpg",
            "expected_waste_group": "Biodegradable",
            "expected_item": "Garden Green Waste",
            "mode": "waste"
        },
        {
            "name": "TEST 6: Electronic Waste / PCB Scrap",
            "file": "test_ewaste.jpg",
            "expected_waste_group": "Non-Biodegradable",
            "expected_item": "Electronic Scrap & Hardware",
            "mode": "waste"
        },
        {
            "name": "TEST 7: Organic Food Leftovers / Scraps",
            "file": "test_food_waste.jpg",
            "expected_waste_group": "Biodegradable",
            "expected_item": "Organic Food Waste",
            "mode": "waste"
        },
        {
            "name": "TEST 8: Timber & Wood Scrap",
            "file": "test_wood_waste.jpg",
            "expected_waste_group": "Biodegradable",
            "expected_item": "Timber & Wood Scrap",
            "mode": "waste"
        },
        {
            "name": "TEST 9: Unknown / Out-of-Distribution Rejection",
            "file": "test_unknown_noise.png",
            "expected_waste_group": "Unknown",
            "expected_item": "Unknown / Unsupported Item",
            "mode": "auto"
        }
    ]

    results = []
    passed_count = 0

    for test in test_specs:
        img_path = REAL_WORLD_DIR / test["file"]
        if not img_path.exists():
            print(f"File not found: {img_path}")
            continue

        img = Image.open(img_path).convert("RGB")
        res = router.route_and_analyze(img, filename=test["file"], mode=test["mode"])

        status = res.get("status")
        item = res.get("displayName") or res.get("item")
        category = res.get("category")
        group = res.get("waste_group")
        conf = res.get("confidence")
        model = res.get("model")
        top3 = res.get("top_predictions", [])

        # Check correctness
        if test["file"] == "test_unknown_noise.png":
            is_correct = (status == "UNCERTAIN")
        else:
            is_correct = (status == "SUCCESS" and group == test["expected_waste_group"])

        if is_correct:
            passed_count += 1

        results.append({
            "test": test["name"],
            "status": status,
            "detected_item": item,
            "category": category,
            "waste_group": group,
            "confidence": conf,
            "model": model,
            "top_predictions": top3,
            "correct": is_correct
        })

        icon = "PASS" if is_correct else "FAIL"
        print(f"\n[{icon}] {test['name']}")
        print(f"  Status        : {status}")
        print(f"  Detected Item : {item}")
        print(f"  Category      : {category}")
        print(f"  Waste Group   : {group}")
        print(f"  Confidence    : {conf}")
        print(f"  Model Used    : {model}")
        if top3:
            print("  Top 3 Predictions:")
            for p in top3:
                print(f"    - {p.get('displayName', p.get('class'))}: {p.get('confidence_pct')}")

    print(f"\nReal-World Evaluation Score: {passed_count}/{len(test_specs)} ({passed_count/len(test_specs)*100:.1f}%)")

    report_file = Path(__file__).parent / "reports" / "real_world_validation_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_tests": len(test_specs),
            "passed": passed_count,
            "accuracy_pct": round(passed_count / len(test_specs) * 100, 1),
            "results": results
        }, f, indent=2)
    print(f"[Report] Saved real world validation results to: {report_file}")

if __name__ == "__main__":
    run_real_world_tests()
