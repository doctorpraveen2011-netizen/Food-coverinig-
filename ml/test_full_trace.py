import sys
import base64
import json
import io
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from infer import analyzer, router

print("=" * 70)
print("STEP 11 — END-TO-END TRACE FOR MOLDY ORANGE IMAGE")
print("=" * 70)

# Stage 1: Upload / Load Image
img_path = Path(__file__).parent / "real_world_test" / "test_rotten_orange.png"
print(f"[Stage 1: Upload] Loading image from {img_path}")
assert img_path.exists(), f"Image {img_path} does not exist!"

with open(img_path, "rb") as f:
    raw_bytes = f.read()
b64_str = f"data:image/png;base64,{base64.b64encode(raw_bytes).decode('utf-8')}"
print(f"  Base64 string created. Length: {len(b64_str)} chars")

# Stage 2: API Decoding
print("\n[Stage 2: API Decoding]")
header, data = b64_str.split(",", 1)
decoded = base64.b64decode(data)
pil_raw = Image.open(io.BytesIO(decoded))
print(f"  Raw PIL image format: {pil_raw.format}, size: {pil_raw.size}, mode: {pil_raw.mode}")
assert (pil_raw.format or "").upper() in ["JPEG", "JPG", "PNG", "WEBP"], "Format not allowed!"
pil_rgb = pil_raw.convert("RGB")
print(f"  Converted to RGB: mode: {pil_rgb.mode}, size: {pil_rgb.size}")

# Stage 3: Transform & Tensor
print("\n[Stage 3: Transform & Preprocessing]")
prep = analyzer.waste_analyzer.prep_transform
tensor_img = prep(pil_rgb).unsqueeze(0).to(analyzer.waste_analyzer.device)
print(f"  Tensor shape: {tensor_img.shape}, dtype: {tensor_img.dtype}, device: {tensor_img.device}")
assert tensor_img.shape == (1, 3, 224, 224), f"Wrong tensor shape: {tensor_img.shape}"

# Stage 4: Router & Model Inference
print("\n[Stage 4: Router & Model Inference]")
result = analyzer.analyze(pil_rgb, filename="test_rotten_orange.png", mode="auto")
print(f"  Router output status: {result.get('status')}")
print(f"  Detected item:        {result.get('displayName') or result.get('item')}")
print(f"  Predicted class:      {result.get('predicted_class')}")
print(f"  Freshness:            {result.get('freshness')}")
print(f"  Confidence:           {result.get('confidence') or result.get('confidence_pct')}")
print(f"  Waste group:          {result.get('waste_group') or result.get('wasteGroup')}")
print(f"  Recommendation:       {result.get('recommendation')}")
print(f"  Detected objects:     {len(result.get('detected_objects', []))}")
for obj in result.get("detected_objects", []):
    print(f"    - Object: {obj.get('label')}, conf: {obj.get('confidence')}, bbox: {obj.get('box_2d')}")

# Stage 5: JSON Response Serialization
print("\n[Stage 5: JSON Serialization]")
json_str = json.dumps(result, default=str)
print(f"  JSON payload successfully serialized ({len(json_str)} bytes).")

print("\n" + "=" * 70)
print("STAGE RESULT: MOLDY ORANGE END-TO-END TRACE COMPLETED SUCCESSFULLY")
print("=" * 70)
