import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_demo_flow():
    # 1. Reset
    resp = client.post("/simulate/reset")
    assert resp.status_code == 200
    
    # 2. Check Initial State
    state = client.get("/state").json()
    assert state["status"] == "NORMAL"
    assert state["plan_version"] == 1
    
    # 3. Crash
    resp = client.post("/simulate/crash")
    assert resp.status_code == 200
    state = client.get("/state").json()
    assert state["status"] == "CONFIRMATION"
    assert state["telemetry"]["impact_g"] == 6.8
    
    # 4. Unresponsive
    resp = client.post("/simulate/unresponsive")
    assert resp.status_code == 200
    state = client.get("/state").json()
    assert state["status"] == "ACTIVE_EMERGENCY"
    assert state["allocation"] is not None
    assert state["allocation"]["target_hospital"] == "Jinnah Trauma Center (Hospital B)"
    assert len(state["allocation"]["rejected_facilities"]) > 0
    
    # 5. Gridlock
    resp = client.post("/simulate/gridlock")
    assert resp.status_code == 200
    state = client.get("/state").json()
    assert state["status"] == "RE_PLANNING"
    assert state["plan_version"] == 4
    assert state["allocation"]["target_hospital"] == "Aga Khan University Hospital (Hospital C)"
