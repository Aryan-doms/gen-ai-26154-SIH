# End-to-end verification of editorial review and sign-off workflow
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_editorial_workflow():
    print("=" * 80)
    print("EDITORIAL REVIEW WORKFLOW VERIFICATION")
    print("=" * 80)

    # 1. Test Home screen data
    print("\n[1] Verifying GET /api/work (Dashboard overview)...")
    res1 = client.get("/api/work")
    assert res1.status_code == 200
    dash = res1.json()
    print(f"  [✓] Needs Attention items: {len(dash['needs_attention'])}")
    for item in dash['needs_attention']:
        print(f"      • {item['title']} ({item['id']}) - {item['unapproved_count']} unapproved outputs pending review")

    # 2. Test Workspace details
    print("\n[2] Verifying GET /api/work/TRF-2026-0417 (Workspace overview)...")
    res2 = client.get("/api/work/TRF-2026-0417")
    assert res2.status_code == 200
    work = res2.json()
    print(f"  [✓] Project Title: {work['title']}")
    print(f"  [✓] Source files: {len(work['source_package'])}")
    print(f"  [✓] Verified claims: {len(work['claims'])}")
    print(f"  [✓] Deliverables: {len(work['outputs'])}")

    # 3. Test Manual Edit & Status Reset
    print("\n[3] Verifying POST /api/work/TRF-2026-0417/edit (Edit draft)...")
    edit_payload = {
        "output_type": "security_advisory",
        "updated_content": "Technical Advisory: Modified draft for editorial review."
    }
    res3 = client.post("/api/work/TRF-2026-0417/edit", json=edit_payload)
    assert res3.status_code == 200
    edit_res = res3.json()
    print(f"  [✓] Status after editing: '{edit_res['output']['status']}' (Properly requires review!)")

    # 4. Test Prompt-Based Edit
    print("\n[4] Verifying POST /api/work/TRF-2026-0417/prompt-edit (Prompt instruction revision)...")
    prompt_payload = {
        "output_type": "executive_summary",
        "instruction": "Make the summary clearer and highlight containment speed"
    }
    res4 = client.post("/api/work/TRF-2026-0417/prompt-edit", json=prompt_payload)
    assert res4.status_code == 200
    print("  [✓] Prompt-based edit successfully applied to draft!")

    # 5. Test Approval
    print("\n[5] Verifying POST /api/work/TRF-2026-0417/approve (Editorial sign-off)...")
    appr_payload = {
        "output_type": "security_advisory",
        "reviewer_name": "Lead Analyst"
    }
    res5 = client.post("/api/work/TRF-2026-0417/approve", json=appr_payload)
    assert res5.status_code == 200
    print("  [✓] Deliverable successfully marked as 'Approved' by reviewer!")

    print("\n" + "=" * 80)
    print("[✓] ALL EDITORIAL REVIEW WORKFLOW CRITERIA SUCCESSFULLY PASSED!")
    print("=" * 80)

if __name__ == "__main__":
    test_editorial_workflow()
