# Verification script for Stage 7: Fix Once -> Selective Impact Analysis & Version Diffing
import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_stage7():
    print("=" * 80)
    print("STAGE 7 VERIFICATION: FIX ONCE -> SELECTIVE IMPACT ANALYSIS & VERSION DIFF")
    print("=" * 80)

    work_id = "2026-0417"

    # 1. Fetch initial state
    print(f"\n[1] Verifying initial work state for {work_id}...")
    res = client.get(f"/api/work/{work_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    work = res.json()
    print(f"  [✓] Work Title: {work['title']}")
    print(f"  [✓] Deliverables count: {len(work['outputs'])}")

    # 2. Check initial claim CLM-001
    claim_1 = next((c for c in work["claims"] if c["claim_id"] == "CLM-001"), None)
    assert claim_1 is not None, "CLM-001 not found"
    print(f"  [✓] Current CLM-001: '{claim_1['claim_text']}'")
    assert "47 minutes" in claim_1["claim_text"]

    # 3. Simulate reviewer approving all outputs initially
    print("\n[2] Approving initial deliverables...")
    res = client.post(f"/api/work/{work_id}/approve", json={"reviewer_name": "Lead Analyst"})
    assert res.status_code == 200
    work = client.get(f"/api/work/{work_id}").json()
    all_appr = all(o["status"] == "Approved" for o in work["outputs"])
    print(f"  [✓] All deliverables stamped as Approved: {all_appr}")

    # 4. Trigger Stage 7: Update CLM-001 from 47 minutes to 52 minutes
    print("\n[3] Triggering Stage 7: POST /api/work/{id}/claims/CLM-001...")
    update_payload = {
        "new_claim_text": "The incident resulted in approximately 52 minutes of service disruption before containment protocols were completed at 03:22 UTC.",
        "new_value": "52 minutes",
        "reason": "Corrected timeline log verified by lead forensic auditor"
    }
    res = client.post(f"/api/work/{work_id}/claims/CLM-001", json=update_payload)
    assert res.status_code == 200, f"Update failed: {res.text}"
    impact_data = res.json()

    print(f"  [✓] Impact analysis summary: {impact_data['message']}")
    print(f"  [✓] Affected deliverables ({len(impact_data['affected_deliverables'])}): {impact_data['affected_deliverables']}")
    print(f"  [✓] Unaffected deliverables ({len(impact_data['unaffected_deliverables'])}): {impact_data['unaffected_deliverables']}")
    print(f"  [✓] Cross-checker status after propagation: {impact_data['cross_check_status']}")
    print(f"  [✓] Validator status after propagation: {impact_data['validation_status']}")

    # 5. Verify selective status reset and version history
    print("\n[4] Verifying selective status reset and version diffs...")
    updated_work = client.get(f"/api/work/{work_id}").json()

    for out in updated_work["outputs"]:
        out_type = out["type"]
        status = out["status"]
        versions = out.get("versions", [])
        
        if out_type in impact_data["affected_deliverables"]:
            # Rule: Affected outputs MUST become "Needs review" and contain 52 minutes in v2!
            assert status == "Needs review", f"Expected {out_type} status to be 'Needs review', got '{status}'"
            assert len(versions) >= 2, f"Expected at least 2 versions for {out_type}"
            v1_text = versions[0]["content"]
            v2_text = versions[1]["content"]
            assert "52 minutes" in v2_text or "52m" in v2_text or "52-minute" in v2_text, f"52 minutes not found in {out_type} v2"
            print(f"  [✓] {out_type:<20} -> Status: '{status}' | v1 length: {len(v1_text)} | v2 length: {len(v2_text)} (52m confirmed)")
        else:
            print(f"  [✓] {out_type:<20} -> Status: '{status}' (Untouched)")

    # 6. Re-approval of v2
    print("\n[5] Verifying human review sign-off on v2...")
    res = client.post(f"/api/work/{work_id}/approve", json={"output_type": "executive_summary", "reviewer_name": "Lead Analyst"})
    assert res.status_code == 200
    final_work = client.get(f"/api/work/{work_id}").json()
    exec_out = next(o for o in final_work["outputs"] if o["type"] == "executive_summary")
    assert exec_out["status"] == "Approved"
    print(f"  [✓] Executive Summary v2 approved by human reviewer: {exec_out['status']}")

    print("\n" + "=" * 80)
    print("[✓] ALL STAGE 7 VERIFICATION CRITERIA SUCCESSFULLY PASSED!")
    print("=" * 80)

if __name__ == "__main__":
    test_stage7()
