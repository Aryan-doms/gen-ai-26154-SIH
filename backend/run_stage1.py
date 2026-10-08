import sys
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.services.canonical_extractor import extract_canonical_source, calculate_package_hash
from app.models.canonical import CanonicalSource

def main():
    dummy_dir = backend_dir.parent / "dummy_data"
    print(f"[*] Reading dummy incident files from: {dummy_dir}")
    
    # Calculate package hash
    file_paths = [str(p) for p in dummy_dir.glob("*.txt")]
    package_hash = calculate_package_hash(file_paths)
    print(f"[*] Pre-processing Source Package SHA-256 (Source Seal Anchor): {package_hash}\n")
    
    # Extract canonical source
    canonical_obj = extract_canonical_source(str(dummy_dir), case_id="INC-2026-0417")
    
    # Validate against Pydantic schema explicitly
    validated = CanonicalSource.model_validate(canonical_obj)
    
    # Export to formatted JSON
    json_output = validated.model_dump_json(indent=2)
    print(json_output)
    
    # Save output to stage1_canonical_output.json
    output_path = backend_dir / "stage1_canonical_output.json"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json_output)
    print(f"\n[✓] Canonical source successfully validated against Pydantic schema!")
    print(f"[✓] Saved structured output to: {output_path}")

if __name__ == "__main__":
    main()
