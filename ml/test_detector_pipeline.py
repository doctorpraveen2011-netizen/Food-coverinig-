import sys
from pathlib import Path
from PIL import Image
import numpy as np

# Add ml to path
ml_dir = Path(__file__).parent
sys.path.insert(0, str(ml_dir))

from vision_detector import get_vision_detector

print("Loading WasteVisionDetector...")
detector = get_vision_detector()
print("Detector loaded successfully!")

# Test 1: Synthetic food/burger image (golden brown, lettuce green, red tomato tones)
w, h = 480, 360
food_img = np.zeros((h, w, 3), dtype=np.uint8)
# Background tray (neutral grey)
food_img[:, :] = [180, 180, 180]
# Burger bun (golden brown) in center-left
food_img[80:260, 60:240] = [210, 150, 75]
# Lettuce green
food_img[140:170, 70:230] = [60, 175, 45]
# French fries (golden yellow) in center-right
food_img[100:270, 260:420] = [235, 195, 55]

pil_food = Image.fromarray(food_img)
res = detector.detect_and_classify(pil_food, filename="burger_and_fries_leftovers.jpg")

print("\n" + "="*60)
print("TEST 1: BURGER, FRIES AND LEFTOVERS SCENE")
print("="*60)
print("Status:", res["status"])
print("Detected Item:", res["detected_item"])
print("Category:", res["category"])
print("Waste Group:", res["waste_group"])
print("Confidence:", res["confidence"])
print("Object Count:", res["object_count"])
for i, obj in enumerate(res["detected_objects"]):
    print(f"  Object {i+1}: {obj['label']} | {obj['category']} | Conf: {obj['confidence_pct']} | BBox: {obj['bbox']}")
print("Mixed Waste Stream:", res["scene_summary"]["is_mixed_stream"])
print("Segregation Advice:", res["scene_summary"]["segregation_guidance"])
print("Model Version:", res["model_version"])
assert "Metal Cans" not in res["detected_item"], f"FAIL: Expected Food/Organic, got {res['detected_item']}"
print("\n>>> TEST 1 PASSED: Zero false metal detection on burger/fries scene! <<<")
