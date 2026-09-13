"""Central configuration for the LIFEOS backend.

Pydantic-Settings driven, loaded from ``.env`` when present. Every value has a
safe default so the system boots with zero configuration.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
HOSPITALS_SEED_PATH = Path(__file__).resolve().parent / "data" / "hospitals.json"


class Settings(BaseSettings):
    """Runtime settings. Reads environment variables + optional `.env`."""

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Service -------------------------------------------------------------
    app_name: str = "LIFEOS"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # --- Autonomy -------------------------------------------------------------
    challenge_timeout_s: float = 10.0
    fallback_budget_ms: float = 10.0

    # --- Optional LLM inference layer (default OFF — deterministic authority) ---
    llm_provider: str = "off"
    llm_base_url: str = ""
    llm_model: str = ""
    llm_api_key: str = ""
    llm_timeout_ms: float = 1800.0
    llm_timeout_s: float = 1.8

    # --- Thresholds shared by perception + fallback engine --------------------
    crash_g_threshold: float = 4.0
    crash_db_threshold: float = 88.0
    severe_g_threshold: float = 6.5

    # --- Paths ----------------------------------------------------------------
    hospitals_seed_path: Path = HOSPITALS_SEED_PATH

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_origins(cls, value: object) -> object:
        """Accept either a JSON list string or a plain comma separated list."""
        if isinstance(value, str) and value.strip().startswith("["):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return [o.strip() for o in value.strip("[]").split(",") if o.strip()]
        if isinstance(value, str):
            return [o.strip() for o in value.split(",") if o.strip()]
        return value

    @property
    def llm_enabled(self) -> bool:
        """True only when a provider and a key are actually configured."""
        return bool(
            self.llm_provider
            and self.llm_provider.lower() != "off"
            and self.llm_api_key
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton accessor."""
    return Settings()