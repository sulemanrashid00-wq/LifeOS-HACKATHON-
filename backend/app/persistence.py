import sqlite3
import asyncio
from pathlib import Path
from app.models.schemas import EmergencyState

DB_PATH = Path(__file__).parent / "data" / "lifeos.db"

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                incident_id TEXT PRIMARY KEY,
                status TEXT,
                plan_version INTEGER,
                created_at TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT,
                impact_g REAL,
                speed_kmh REAL,
                audio_db REAL,
                timestamp TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id TEXT,
                event TEXT,
                plan_version INTEGER,
                timestamp TEXT
            )
        """)
        conn.commit()

def _log_state_sync(state: EmergencyState):
    try:
        with sqlite3.connect(DB_PATH, timeout=5.0) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO incidents (incident_id, status, plan_version, created_at)
                VALUES (?, ?, ?, ?)
            """, (state.incident_id, state.status, state.plan_version, state.telemetry.last_updated))
            
            cursor.execute("""
                INSERT INTO telemetry_logs (incident_id, impact_g, speed_kmh, audio_db, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (state.incident_id, state.telemetry.impact_g, state.telemetry.speed_kmh, state.telemetry.decibel_level, state.telemetry.last_updated))
            
            if state.timeline:
                latest_event = state.timeline[-1]
                cursor.execute("""
                    INSERT INTO audit_events (incident_id, event, plan_version, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (state.incident_id, latest_event.event, state.plan_version, latest_event.timestamp))
            conn.commit()
    except Exception as e:
        print(f"DB Persistence Error: {e}")

def log_transition(state: EmergencyState):
    """Zero-overhead async background task for DB writes"""
    asyncio.create_task(asyncio.to_thread(_log_state_sync, state.model_copy(deep=True)))

