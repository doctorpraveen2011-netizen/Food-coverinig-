import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from infer import analyzer, router
from test_acceptance_suite import (
    create_burger_fries_img,
    create_plastic_bottle_img,
    create_metal_can_img,
    create_cardboard_img,
    create_paper_img,
    create_glass_bottle_img,
    create_textile_img,
    create_battery_img,
    create_mixed_scene_img,
    create_unrelated_img
)

print("=" * 80)
print("FINAL ACCEPTANCE TEST: 12 REAL TEST SPECIMENS")
print("=" * 80)

rw_dir = Path(__file__).parent / "real_world_test"

# 1. spoiled orange
img_rotten_orange = Image.open(rw_dir / "test_rotten_orange.png").convert("RGB")
# 2. cooked food waste
img_cooked_food = Image.open(rw_dir / "test_food_waste.jpg").convert("RGB") if (rw_dir / "test_food_waste.jpg").exists() else create_burger_fries_img()
# 3. plastic bottle
img_plastic_bottle = Image.open(rw_dir / "test_plastic_bottle.jpg").convert("RGB") if (rw_dir / "test_plastic_bottle.jpg").exists() else create_plastic_bottle_img()
# 4. plastic bag
img_plastic_bag = Image.open(rw_dir / "test_leaf_waste.jpg").convert("RGB") if (rw_dir / "test_leaf_waste.jpg").exists() else create_plastic_bottle_img()
# 5. paper
img_paper = Image.open(rw_dir / "test_paper_waste.jpg").convert("RGB") if (rw_dir / "test_paper_waste.jpg").exists() else create_paper_img()
# 6. cardboard
img_cardboard = create_cardboard_img()
# 7. metal can
img_metal_can = Image.open(rw_dir / "test_metal_can.jpg").convert("RGB") if (rw_dir / "test_metal_can.jpg").exists() else create_metal_can_img()
# 8. glass
img_glass = create_glass_bottle_img()
# 9. clothes
img_clothes = create_textile_img()
# 10. battery
img_battery = Image.open(rw_dir / "test_ewaste.jpg").convert("RGB") if (rw_dir / "test_ewaste.jpg").exists() else create_battery_img()
# 11. mixed-waste image
img_mixed = create_mixed_scene_img()
# 12. unrelated object
img_unrelated = Image.open(rw_dir / "test_unknown_noise.png").convert("RGB") if (rw_dir / "test_unknown_noise.png").exists() else create_unrelated_img()

test_items = [
    ("1. spoiled orange", img_rotten_orange, "auto"),
    ("2. cooked food waste", img_cooked_food, "waste"),
    ("3. plastic bottle", img_plastic_bottle, "waste"),
    ("4. plastic bag", img_plastic_bag, "waste"),
    ("5. paper", img_paper, "waste"),
    ("6. cardboard", img_cardboard, "waste"),
    ("7. metal can", img_metal_can, "waste"),
    ("8. glass", img_glass, "waste"),
    ("9. clothes", img_clothes, "waste"),
    ("10. battery", img_battery, "waste"),
    ("11. mixed-waste image", img_mixed, "waste"),
    ("12. unrelated object", img_unrelated, "auto"),
]

for label, img, mode in test_items:
    res = analyzer.analyze(img, filename=label.replace(" ", "_").replace(".", "") + ".jpg", mode=mode)
    pred_item = res.get("displayName") or res.get("detected_item") or res.get("item") or "Unknown"
    status = res.get("status", "SUCCESS")
    conf = res.get("confidence") or res.get("confidence_pct") or "0%"
    waste_group = res.get("waste_group") or res.get("wasteGroup") or "N/A"
    recom = res.get("recommendation", "N/A")
    num_objs = len(res.get("detected_objects", []))
    print(f"\n{label}:")
    print(f"  Status:       {status}")
    print(f"  Prediction:   {pred_item}")
    print(f"  Confidence:   {conf}")
    print(f"  Waste Group:  {waste_group}")
    print(f"  Objects:      {num_objs} detected")
    print(f"  Action/Rec:   {recom[:70]}...")

print("\n" + "=" * 80)
print("FINAL ACCEPTANCE TEST COMPLETE")
print("=" * 80)
