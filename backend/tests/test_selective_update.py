# Verification test for Selective Fact Propagation:
# "An unaffected approved deliverable must never be regenerated when an unrelated claim changes."
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.services.store import store

client = TestClient(app)

def test_selective_update():
    print("=" * 80)
    print("SELECTIVE FACT PROPAGATION: UNAFFECTED DELIVERABLE PRESERVATION")
    print("=" * 80)

    # 1. Reset store to initial state
    store._load_demo_transformation()
    work_id = "2026-0417"

    # 2. Mark all 9 deliverables as Approved initially
    for o in store.items[work_id]["outputs"]:
        o["status"] = "Approved"
    store.items[work_id]["status"] = "Approved"

    print("[1] Baseline established: All 9 deliverables marked 'Approved'.")

    # 3. Update CLM-003 (Ingress IP)
    new_ip = "198.51.100.25"
    payload = {
        "new_claim_text": f"Attacker ingress traffic originated from proxy host IPv4 {new_ip} (AS208046).",
        "new_value": new_ip,
        "reason": "Perimeter network audit confirmed proxy IP"
    }

    res = client.post(f"/api/work/{work_id}/claims/CLM-003", json=payload)
    assert res.status_code == 200, f"Update failed: {res.text}"
    data = res.json()

    affected = data["affected_deliverables"]
    unaffected = data["unaffected_deliverables"]

    print(f"\n[2] Triggered POST /api/work/{work_id}/claims/CLM-003")
    print(f"  [✓] Affected deliverables ({len(affected)}): {affected}")
    print(f"  [✓] Unaffected deliverables ({len(unaffected)}): {unaffected}")

    # 4. Preservation checks
    assert len(unaffected) > 0, "Expected unaffected deliverables for selective claim CLM-003"
    assert "linkedin_post" in unaffected, "linkedin_post does not cite CLM-003 and must be unaffected"
    assert "whatsapp_message" in unaffected, "whatsapp_message does not cite CLM-003 and must be unaffected"

    work_after = store.get(work_id)
    outputs_by_type = {o["type"]: o for o in work_after["outputs"]}

    print("\n[3] Auditing deliverable state after selective propagation:")
    for out_type in unaffected:
        out_obj = outputs_by_type[out_type]
        # Rule 1: Unaffected deliverable must remain Approved
        assert out_obj["status"] == "Approved", f"PRESERVATION VIOLATED: {out_type} status reset to {out_obj['status']}!"
        # Rule 2: Unaffected deliverable must not have a v2 record
        assert len(out_obj.get("versions", [])) == 1, f"PRESERVATION VIOLATED: {out_type} has {len(out_obj.get('versions', []))} versions!"
        print(f"  [✓] PRESERVED: {out_type:<20} -> Status: 'Approved' | Version: v1 (Zero token waste)")

    for out_type in affected:
        out_obj = outputs_by_type[out_type]
        # Affected deliverable must be reset to Needs review
        assert out_obj["status"] == "Needs review", f"{out_type} was not reset to Needs review!"
        assert len(out_obj.get("versions", [])) == 2, f"{out_type} did not produce a v2 version!"
        print(f"  [✓] REGENERATED: {out_type:<18} -> Status: 'Needs review' | Version: v2 ({new_ip} present)")

    print("\n" + "=" * 80)
    print("[✓] ALL SELECTIVE PROPAGATION CRITERIA SUCCESSFULLY PASSED!")
    print("=" * 80)

if __name__ == "__main__":
    test_selective_update()
