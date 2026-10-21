"""
Acceptance Test Suite for FoodCovering AI Food & Waste Vision Intelligence Hub
Runs 12 comprehensive test cases matching Requirement 43:
A. Burger/fries/food leftovers
B. Plastic bottle
C. Metal can
D. Cardboard
E. Paper
F. Glass bottle
G. Leaf/organic waste
H. Clothes
I. Battery
J. Mixed food + plastic scene
K. Completely unrelated object (OOD / Desktop monitor)
L. Blurred / uninformative image
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from vision_detector import get_vision_detector

def run_acceptance_suite():
    print("=" * 70)
    print("FOODCOVERING VISION AI ACCEPTANCE SUITE (12 TEST CASES)")
    print("=" * 70)

    detector = get_vision_detector()
    results = []

    # Helper to create test synthetic/representative images
    test_cases = [
        ("A. Burger, Fries & Food Leftovers", "Food Waste / Organic Leftovers", create_burger_fries_img),
        ("B. Plastic Bottle", "Plastic Bottle (Non-Biodegradable / Recyclable)", create_plastic_bottle_img),
        ("C. Metal Can", "Metal Can / Aluminum Tins", create_metal_can_img),
        ("D. Cardboard Box", "Cardboard Packaging (Recyclable)", create_cardboard_img),
        ("E. Paper Wrapper / Document", "Paper (Recyclable / Compostable)", create_paper_img),
        ("F. Glass Bottle", "Glass (Recyclable / Fragile)", create_glass_bottle_img),
        ("G. Leaf / Organic Garden Waste", "Organic Waste / Foliage (Biodegradable)", create_leaf_waste_img),
        ("H. Clothes / Textile", "Textile / Clothes (Reusable / Recyclable)", create_textile_img),
        ("I. Battery / E-Waste", "Special Waste: Battery / E-Waste (Hazardous)", create_battery_img),
        ("J. Mixed Food + Plastic Scene", "Mixed Scene: Food Leftovers + Plastic Container", create_mixed_scene_img),
        ("K. Completely Unrelated Object (Desktop)", "Unsupported / Uncertain Object", create_unrelated_img),
        ("L. Blurred / Degraded Image", "Low-Quality / Degraded Scan", create_blurred_img),
    ]

    for code, ground_truth, generator_fn in test_cases:
        img = generator_fn()
        res = detector.detect_and_classify(img, filename=code.lower().replace(" ", "_") + ".jpg")
        
        detected_items = [f"{o['label']} ({o['confidence_pct']})" for o in res.get("detected_objects", [])]
        pred_item = res.get("detected_item", "Unknown")
        conf_pct = res.get("confidence", "0.0%")
        conf_val = float(conf_pct.replace("%", "")) / 100.0 if isinstance(conf_pct, str) and "%" in conf_pct else float(conf_pct)
        low_conf = res.get("low_confidence", False) or conf_val < 0.48
        waste_group = res.get("waste_group", "General")
        model_ver = res.get("model_version", "v3.0")
        is_mixed = res.get("scene_summary", {}).get("is_mixed_stream", False)
        
        # Check correctness against ground truth criteria
        # A: must NOT be metal can; must be food / organic
        is_correct = False
        if "Burger" in code:
            is_correct = "Metal" not in pred_item and ("Food" in pred_item or "Organic" in pred_item or "Biomass" in pred_item)
        elif "Plastic Bottle" in code:
            is_correct = "Plastic" in pred_item
        elif "Metal Can" in code:
            is_correct = "Metal" in pred_item
        elif "Cardboard" in code:
            is_correct = "Cardboard" in pred_item or "Paper" in pred_item
        elif "Paper" in code:
            is_correct = "Paper" in pred_item or "Cardboard" in pred_item
        elif "Glass" in code:
            is_correct = "Glass" in pred_item
        elif "Leaf" in code:
            is_correct = "Organic" in pred_item or "Plant" in pred_item or "Biomass" in pred_item or "Timber" in pred_item
        elif "Clothes" in code:
            is_correct = "Textile" in pred_item or "Clothes" in pred_item
        elif "Battery" in code:
            is_correct = "Battery" in pred_item or "Special" in pred_item or "Metal" in pred_item
        elif "Mixed Food + Plastic" in code:
            is_correct = is_mixed or res.get("mixed_waste_stream", False) or len(res.get("detected_objects", [])) > 1
        elif "Unrelated" in code:
            is_correct = low_conf or conf_val < 0.60 or "Uncertain" in pred_item or "Unsupported" in pred_item
        elif "Blurred" in code:
            is_correct = low_conf or conf_val < 0.50 or res.get("status") in ["uncertain", "low_quality"]

        results.append({
            "test_case": code,
            "ground_truth": ground_truth,
            "detected_objects": detected_items,
            "prediction": pred_item,
            "confidence": conf_pct,
            "low_confidence": low_conf,
            "waste_group": waste_group,
            "is_correct": is_correct,
            "model_version": model_ver
        })

        print(f"\nTEST CASE: {code}")
        print(f"  Ground Truth:     {ground_truth}")
        print(f"  Detected Objects: {', '.join(detected_items) if detected_items else 'None'}")
        print(f"  Final Prediction: {pred_item}")
        print(f"  Confidence:       {conf_pct} (Low Conf Flag: {low_conf})")
        print(f"  Waste Group:      {waste_group}")
        print(f"  Verdict:          {'CORRECT' if is_correct else 'INCORRECT'}")
        print(f"  Model Version:    {model_ver}")

    print("\n" + "=" * 70)
    passed_count = sum(1 for r in results if r["is_correct"])
    print(f"ACCEPTANCE RESULTS: {passed_count}/{len(results)} PASSED")
    print("=" * 70)
    return results

def create_burger_fries_img():
    # 480x360 canvas with golden bun, patty, lettuce, tomato, fries
    img = Image.new("RGB", (480, 360), (220, 215, 205))
    arr = np.array(img)
    # Burger center
    arr[100:260, 80:260] = [190, 130, 60]     # bun brown
    arr[160:210, 80:260] = [80, 45, 25]       # beef patty
    arr[150:165, 80:260] = [50, 155, 40]      # lettuce green
    arr[170:185, 100:240] = [200, 35, 30]     # tomato red
    # Fries right
    arr[80:250, 300:430] = [230, 180, 40]     # golden yellow fries
    return Image.fromarray(arr)

def create_plastic_bottle_img():
    img = Image.new("RGB", (400, 400), (230, 230, 230))
    arr = np.array(img)
    arr[60:340, 150:250] = [30, 120, 210]     # blue translucent PET bottle
    arr[30:60, 180:220] = [240, 240, 240]     # bottle cap
    return Image.fromarray(arr)

def create_metal_can_img():
    img = Image.new("RGB", (400, 400), (200, 200, 200))
    arr = np.array(img)
    # Metallic specular cylinder
    for y in range(80, 320):
        for x in range(140, 260):
            norm_x = (x - 140) / 120.0
            val = int(140 + 115 * np.sin(norm_x * np.pi))
            arr[y, x] = [val, val, val]
    return Image.fromarray(arr)

def create_cardboard_img():
    img = Image.new("RGB", (400, 400), (240, 240, 240))
    arr = np.array(img)
    arr[80:320, 80:320] = [170, 120, 70]     # corrugated kraft brown
    return Image.fromarray(arr)

def create_paper_img():
    img = Image.new("RGB", (400, 400), (180, 180, 180))
    arr = np.array(img)
    arr[60:340, 100:300] = [245, 245, 242]   # white cellulose paper
    return Image.fromarray(arr)

def create_glass_bottle_img():
    img = Image.new("RGB", (400, 400), (220, 220, 220))
    arr = np.array(img)
    arr[70:330, 160:240] = [40, 130, 80]     # green tinted glass
    return Image.fromarray(arr)

def create_leaf_waste_img():
    img = Image.new("RGB", (400, 400), (120, 90, 60))
    arr = np.array(img)
    arr[80:320, 80:320] = [60, 140, 40]      # rich chlorophyllic leaves
    return Image.fromarray(arr)

def create_textile_img():
    img = Image.new("RGB", (400, 400), (220, 220, 220))
    arr = np.array(img)
    # Denim blue cloth texture
    arr[80:320, 80:320] = [45, 75, 130]
    return Image.fromarray(arr)

def create_battery_img():
    img = Image.new("RGB", (400, 400), (220, 220, 220))
    arr = np.array(img)
    arr[120:280, 170:230] = [20, 20, 20]     # black battery casing
    arr[100:120, 185:215] = [210, 175, 50]   # gold positive terminal
    return Image.fromarray(arr)

def create_mixed_scene_img():
    img = Image.new("RGB", (500, 400), (220, 215, 205))
    arr = np.array(img)
    # Left: food leftovers (burger/fries)
    arr[100:300, 50:240] = [190, 130, 60]
    arr[180:240, 50:240] = [80, 45, 25]
    # Right: plastic cup / container
    arr[100:300, 300:440] = [30, 120, 210]
    return Image.fromarray(arr)

def create_unrelated_img():
    # Neutral gradient / desktop UI
    img = Image.new("RGB", (400, 400), (100, 100, 100))
    return img

def create_blurred_img():
    img = Image.new("RGB", (400, 400), (180, 180, 180))
    return img.filter(ImageFilter.GaussianBlur(radius=15))

if __name__ == "__main__":
    run_acceptance_suite()
