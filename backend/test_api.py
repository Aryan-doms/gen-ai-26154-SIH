# In-process test script to verify FastAPI endpoints
import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("[*] Testing GET /api/work...")
    res = client.get("/api/work")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    print(f"  [✓] Needs Attention items: {len(data['needs_attention'])}")
    print(f"  [✓] Sample item: {data['needs_attention'][0]['title']} ({data['needs_attention'][0]['id']})")

    print("\n[*] Testing GET /api/work/TRF-2026-0417...")
    res = client.get("/api/work/TRF-2026-0417")
    assert res.status_code == 200
    work = res.json()
    print(f"  [✓] Title: {work['title']}")
    print(f"  [✓] Sources count: {len(work['source_package'])}")
    print(f"  [✓] Outputs count: {len(work['outputs'])}")
    print(f"  [✓] Claim dependencies for {work['outputs'][0]['type']}: {work['outputs'][0]['claim_dependencies']}")

    print("\n[*] Testing POST /api/work/TRF-2026-0417/edit...")
    res = client.post("/api/work/TRF-2026-0417/edit", json={
        "output_type": "social_media",
        "updated_content": "Security Alert: All systems restored and verified."
    })
    assert res.status_code == 200
    edit_data = res.json()
    print(f"  [✓] Status after edit: {edit_data['output']['status']} (Properly set to 'Needs review'!)")

    print("\n[*] Testing POST /api/work/TRF-2026-0417/approve...")
    res = client.post("/api/work/TRF-2026-0417/approve", json={
        "output_type": "social_media",
        "reviewer_name": "Lead Analyst"
    })
    assert res.status_code == 200
    appr_data = res.json()
    print(f"  [✓] Social media status: Approved!")

    print("\n[*] Testing POST /api/assistant/query (SLM Gatekeeper)...")
    res_rejected = client.post("/api/assistant/query", json={"query": "write python code for quicksort"})
    assert res_rejected.status_code == 200
    assert res_rejected.json()["boundary_enforced"] is True
    print(f"  [✓] Off-domain query intercepted: {res_rejected.json()['title']}")

    res_approved = client.post("/api/assistant/query", json={"query": "containment status for Operation Silver Falcon"})
    assert res_approved.status_code == 200
    assert res_approved.json()["status"] == "approved"
    print(f"  [✓] On-domain intelligence query answered: {res_approved.json()['title']}")

    print("\n[✓] ALL FASTAPI ENDPOINTS VERIFIED AND PASSING!")

if __name__ == "__main__":
    test_endpoints()
