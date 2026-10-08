# Verification test for Context Assistant domain boundary enforcement and grounded queries
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_off_domain_query_rejection():
    # 1. Off-domain query intercepted
    resp = client.post("/api/assistant/query", json={"query": "write python code to solve two sum"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "rejected"
    assert data["boundary_enforced"] is True
    assert "Operational Boundary" in data["title"]
    assert "restricted" in data["answer"].lower() or "blocked" in data["answer"].lower()
    assert data["suggested_queries"] is not None and len(data["suggested_queries"]) > 0
    print("PASS: Off-domain query rejected by Assistant with operational boundary notice.")

def test_on_domain_containment_query():
    # 2. On-domain containment status query
    resp = client.post("/api/assistant/query", json={"query": "What is the containment status of Operation Silver Falcon?"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "approved"
    assert data["boundary_enforced"] is False
    assert "Intelligence" in data["title"] or "Briefing" in data["title"]
    assert "CLM-005" in data["referenced_claims"] or "CLM-005" in data["answer"]
    assert "03:22 UTC" in data["answer"] or "contained" in data["answer"].lower()
    print("PASS: On-domain containment query answered with grounded source facts.")

def test_on_domain_ioc_query():
    # 3. On-domain indicator query
    resp = client.post("/api/assistant/query", json={"query": "What are the key IoCs for 2026-0417?"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "approved"
    assert "185.203.117.42" in data["answer"] or "admin-research" in data["answer"]
    assert "CLM-003" in data["referenced_claims"] or "CLM-002" in data["referenced_claims"]
    print("PASS: On-domain indicator query returned verified facts and claim references.")

if __name__ == "__main__":
    test_off_domain_query_rejection()
    test_on_domain_containment_query()
    test_on_domain_ioc_query()
    print("\n[✓] ALL CONTEXT ASSISTANT TESTS PASSED SUCCESSFULLY!")
