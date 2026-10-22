import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from infer import router

test_img_path = Path(__file__).parent / "real_world_test" / "test_rotten_orange.png"
print(f"Testing image: {test_img_path}")

if not test_img_path.exists():
    print(f"Error: {test_img_path} does not exist!")
    sys.exit(1)

img = Image.open(test_img_path).convert("RGB")
print(f"Image opened: size={img.size}, mode={img.mode}")

print("\n--- Testing in AUTO mode ---")
res_auto = router.route_and_analyze(img, filename="test_rotten_orange.png", mode="auto")
print("Status:", res_auto.get("status"))
print("DisplayName / Item:", res_auto.get("displayName") or res_auto.get("item"))
print("Predicted Class:", res_auto.get("predicted_class"))
print("Confidence:", res_auto.get("confidence") or res_auto.get("confidence_pct"))
print("Detected objects:", len(res_auto.get("detected_objects", [])))
for obj in res_auto.get("detected_objects", []):
    print("  ->", obj.get("label"), obj.get("confidence"), obj.get("box_2d"))

print("\n--- Testing in FRESHNESS mode ---")
res_fresh = router.route_and_analyze(img, filename="test_rotten_orange.png", mode="freshness")
print("Status:", res_fresh.get("status"))
print("DisplayName / Item:", res_fresh.get("displayName") or res_fresh.get("item"))
print("Predicted Class:", res_fresh.get("predicted_class"))
print("Freshness:", res_fresh.get("freshness"))
print("Confidence:", res_fresh.get("confidence") or res_fresh.get("confidence_pct"))

print("\n--- Testing in WASTE mode ---")
res_waste = router.route_and_analyze(img, filename="test_rotten_orange.png", mode="waste")
print("Status:", res_waste.get("status"))
print("DisplayName / Item:", res_waste.get("displayName") or res_waste.get("item"))
print("Predicted Class:", res_waste.get("predicted_class"))
print("Confidence:", res_waste.get("confidence") or res_waste.get("confidence_pct"))
