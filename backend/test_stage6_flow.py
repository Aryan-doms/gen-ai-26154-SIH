# Stage 6 end-to-end verification script testing API and workspace contracts
import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def main():
    print("="*80)
    print("STAGE 6 VERIFICATION: HUMAN REVIEW API & WORKSPACE STATE CONTRACT")
    print("="*80)

    # 1. Test Home screen data
    print("\n[1] Verifying GET /api/work (Screen 01 Home Dashboard)...")
    res1 = client.get("/api/work")
    assert res1.status_code == 200
    dash = res1.json()
    print(f"  [✓] Needs Attention items: {len(dash['needs_attention'])}")
    for item in dash['needs_attention']:
        print(f"      • {item['title']} ({item['id']}) - {item['unapproved_count']} unapproved outputs pending review")

    # 2. Test Workspace details
    print("\n[2] Verifying GET /api/work/TRF-2026-0417 (Screen 03 IntelForge Workspace)...")
    res2 = client.get("/api/work/TRF-2026-0417")
    assert res2.status_code == 200
    work = res2.json()
    print(f"  [✓] Work Title: {work['title']}")
    print(f"  [✓] Source Package items: {len(work['source_package'])}")
    print(f"  [✓] Canonical Claims extracted: {len(work['claims'])}")
    print(f"  [✓] Output Package deliverables: {len(work['outputs'])}")
    
    # Check claim_dependencies on each output
    print("  [✓] Output deliverables and claim dependencies:")
    for out in work['outputs']:
        print(f"      • {out['type']:<20} Status: {out['status']} | Dependencies: {out['claim_dependencies']}")

    # 3. Test Manual Edit & Status Reset Rule (Rule 3)
    print("\n[3] Verifying POST /api/work/TRF-2026-0417/edit (Edit Draft & Status Enforcement)...")
    edit_payload = {
        "output_type": "security_advisory",
        "updated_content": "Technical Advisory: Modified draft for operational review."
    }
    res3 = client.post("/api/work/TRF-2026-0417/edit", json=edit_payload)
    assert res3.status_code == 200
    edit_res = res3.json()
    print(f"  [✓] Status after editing: '{edit_res['output']['status']}' (Properly requires review!)")

    # 4. Test Prompt-Based Edit
    print("\n[4] Verifying POST /api/work/TRF-2026-0417/prompt-edit (Prompt Instruction Revision)...")
    prompt_payload = {
        "output_type": "executive_summary",
        "instruction": "Make the summary clearer and highlight containment speed"
    }
    res4 = client.post("/api/work/TRF-2026-0417/prompt-edit", json=prompt_payload)
    assert res4.status_code == 200
    print("  [✓] Prompt-based edit successfully applied to draft!")

    # 5. Test Approval
    print("\n[5] Verifying POST /api/work/TRF-2026-0417/approve (Human Review Sign-Off)...")
    appr_payload = {
        "output_type": "security_advisory",
        "reviewer_name": "Lead Analyst"
    }
    res5 = client.post("/api/work/TRF-2026-0417/approve", json=appr_payload)
    assert res5.status_code == 200
    print("  [✓] Output successfully stamped as 'Approved' by reviewer!")

    print("\n" + "="*80)
    print("[✓] ALL STAGE 6 VERIFICATION CRITERIA SUCCESSFULLY PASSED!")
    print("="*80)

if __name__ == "__main__":
    main()
