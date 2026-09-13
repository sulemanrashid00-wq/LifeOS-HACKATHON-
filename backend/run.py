"""LIFEOS backend entrypoint.

Run with::

    python run.py            # dev: uvicorn reload on 0.0.0.0:8000
    python run.py --prod     # prod: single worker, no reload

The script resolves the project root so it works regardless of the current
working directory, then delegates to ``uvicorn.run``.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Ensure the package is importable when running ``python run.py`` directly.
_PROJECT_ROOT = Path(__file__).resolve().parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.config import get_settings  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="LIFEOS — Autonomous AI Emergency Operating System"
    )
    parser.add_argument(
        "--host",
        default=None,
        help="Bind address (defaults to settings.HOST).",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help="Bind port (defaults to settings.PORT).",
    )
    parser.add_argument(
        "--prod",
        action="store_true",
        help="Production mode: no reload, single worker.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Number of uvicorn workers (prod mode only).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = get_settings()

    host = args.host or settings.host
    port = args.port or settings.port

    # Lazy import so --help does not spin up the full app.
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=not args.prod,
        workers=args.workers if args.prod else 1,
        log_level="debug" if settings.debug else "info",
        access_log=settings.debug,
    )


if __name__ == "__main__":
    main()