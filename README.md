# LIFEOS — Autonomous AI Emergency Operating System

**Winner-grade premise:** traditional SOS apps are *passive alerts* that stop the
moment the victim goes unconscious. **LIFEOS is an active autonomous
coordination layer** that fuses multimodal telemetry, isolates raw sensor
observations from AI inferences, routes by **clinical capability over mere
proximity**, coordinates role-tailored payloads to 4 stakeholders, and
**autonomously re-plans routes when hospital beds drop in real time**.

```
lifeos/
├── backend/                  # Python 3.11+ · FastAPI · Pydantic v2
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI + WebSocket manager + REST sim triggers
│   │   ├── config.py         # Pydantic-Settings · CORS · LLM/failover config
│   │   ├── state_machine.py  # 7-state strict FSM + structural diffs
│   │   ├── fallback_engine.py# sub-10ms deterministic failover triage
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── perception.py       # IMU · dB · camera flags -> anomaly report
│   │   │   ├── triage.py           # vocal challenge, severity, evidence chain
│   │   │   ├── resource_matcher.py # Capability>(ETA)>(ICU) weighted scoring
│   │   │   ├── decision.py         # Plan locking, vehicle binding, audit
│   │   │   ├── dynamic_replan.py   # gridlock interception -> Plan v2
│   │   │   └── communication.py    # Victim/Family/Responder/EMR payloads
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py    # strict contracts + provenance-separated evidence
│   │   └── data/hospitals.json
│   ├── tests/test_demo_flow.py  # end-to-end demo smoke suite
│   ├── requirements.txt
│   ├── run.py                 # uvicorn launcher (python run.py)
│   └── .env.example
├── frontend/                  # Next.js 14 · Tailwind · Zustand · Leaflet
│   ├── app/                   # globals.css · layout.tsx · page.tsx
│   ├── components/            # TacticalMap, SensorHUD, HospitalMatrix,
│   │                          # StakeholderPortals, AuditTimeline, SimulatorDeck
│   ├── hooks/useAudioFx.ts    # Web Audio API synthesizer (click/alarm/chime)
│   ├── store/useEmergencyStore.ts  # WS auto-reconnect + audio synthesizers
│   ├── public/sounds/
│   ├── package.json · tsconfig.json · tailwind.config.ts
└── run_all.sh                 # one-shot launcher (backend + frontend)
```

---

## 1 · Scaffold

```bash
# Creates the exact folder tree above (idempotent).
bash scaffold.sh lifeos
```

## 2 · Run the backend

```bash
cd lifeos/backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py                       # or: uvicorn app.main:app --reload
```

Verify: `http://127.0.0.1:8000/health` → `{"status":"ok", ...}`

Run the smoke test that plays the **entire demo flow**:

```bash
python -m tests.test_demo_flow
```

## 3 · Run the frontend

```bash
cd lifeos/frontend
npm install
npm run dev
```

Open `http://localhost:3000`. (Customize the API base with
`NEXT_PUBLIC_API_URL` if the backend runs elsewhere.)

## 3b · One-shot launcher (`run_all.sh`)

```bash
cd lifeos
bash run_all.sh
```

This script creates the Python venv, installs npm packages, spawns the
backend on `:8000` and the frontend on `:3000`, polls `/health` until the
engine is live, then prints the access URLs.

## 4 · The 4-step demo (SimulatorDeck)

| Step | Trigger                              | What the system does                                                        |
|------|--------------------------------------|----------------------------------------------------------------------------|
| 1    | 💥 **Trigger 6.8G Impact**           | Fuses IMU + dB + vision, walks `NORMAL→SUSPICIOUS→CONFIRMATION`, starts the **10s vocal challenge** *(and arms the autonomous escalation watchdog)* |
| 2    | ⏱ **Victim Unresponsive**           | Escalates to HIGH, deterministic failover runs in **<1ms**, capability routing locks **Plan v1 → Hospital B** |
| 3    | 🚨 **Trigger Hospital B Gridlock**   | Registry capacity → 0, FSM `DISPATCHED→RE_PLANNING→DISPATCHED` bumps **Plan v2 → Hospital C**, map polyline visibly re-draws, Hospital B row turns crimson |
| 4    | 🔄 **Reset System Baseline**         | FSM, registry and watchdog fully restored                                  |

> **Autonomous bonus:** if nobody presses "Victim Unresponsive", the backend
> escalates by itself after the 10s window — the demo never stalls.

---

## 5 · The scoring model (transparent by design)

```
Score = (Capability * 0.45) + (ETA proximity * 0.35) + (ICU capacity * 0.20)
```

1. **Hard gate** — `requires_trauma=True` *immediately rejects* any facility
   without a Level-1 trauma unit. Zero ICU beds reject too. Rejected facilities
   never compete numerically; they carry rejection tags → rendered in the
   HospitalMatrix.
2. **Capability tier** — Level-1 trauma + emergency surgery = 100; trauma-only = 85;
   surgery-only = 70; basic = 40.
3. **Proximity** — `100 · e^(−ETA/10)` (ETA = max(geometry, traffic-weighted baseline)).
4. **Capacity** — `min(100, √beds · 40)` (diminishing returns; the first beds matter most).

Verified demo outcome: Hospital A rejected (no trauma), **Hospital B wins Plan v1**
(closer trauma center), **Hospital C wins Plan v2** (after B collapses to capacity 0).

---

## 6 · Failure-domains the system is built to survive

- **LLM timeout / crash** → deterministic `fallback_engine` in <10ms
  (`source=DETERMINISTIC_FALLBACK` tagged on every assessment). The demo never
  freezes. Set `LLM_PROVIDER=off` (default) to remove the dependency entirely.
- **WebSocket drop** → frontend auto-reconnects with exponential backoff
  (800ms → 8s cap) and re-snapshots on connect.
- **Dead sockets** → server prunes failed broadcasts atomically.
- **Illegal FSM moves** → `InvalidTransition` with a human-readable allowed-list.
- **Concurrent mutation** → `asyncio.Lock` wraps every handler; no torn states.
- **Map tile outage** → offline grid fallback keeps route geometry live.

## 7 · Provenance isolation (the core differentiator)

Every datum knows *where it came from*:

- `Telemetry` / `evidence.observed`  → **raw sensor truth**
- `TriageAssessment.inference_source` + `evidence.inferred` → **AI inference**
  with explicit provenance (`HEURISTIC | DETERMINISTIC_FALLBACK | LLM`)

The SensorHUD renders these as pinned, separate panels
`[OBSERVED TELEMETRY]` vs `[INFERRED HYPOTHESIS]` — no conflation, ever.