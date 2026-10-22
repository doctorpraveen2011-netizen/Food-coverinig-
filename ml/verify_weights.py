import torch
from pathlib import Path

ml_dir = Path("ml")
waste_path = ml_dir / "models" / "waste" / "waste_model.pth"
fresh_path = ml_dir / "models" / "freshness" / "freshness_model.pth"

print("Checking waste weights:", waste_path.exists())
waste_state = torch.load(waste_path, map_location="cpu")
for k, v in waste_state.items():
    if "classifier" in k:
        print(f"  {k}: {v.shape}")

print("\nChecking freshness weights:", fresh_path.exists())
fresh_state = torch.load(fresh_path, map_location="cpu")
for k, v in fresh_state.items():
    if "classifier" in k:
        print(f"  {k}: {v.shape}")
