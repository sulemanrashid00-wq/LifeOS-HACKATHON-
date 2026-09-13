#!/usr/bin/env bash
# =============================================================================
# LIFEOS — Autonomous AI Emergency Operating System
# run_all.sh
#
# One-shot launcher that:
#   1. Creates the Python virtualenv and installs backend requirements.
#   2. Installs frontend npm packages.
#   3. Spawns the FastAPI backend in the background on port 8000.
#   4. Spawns the Next.js frontend in the background on port 3000.
#   5. Polls http://127.0.0.1:8000/state until healthy.
#   6. Prints the ready notification.
#
# Usage:  bash run_all.sh
# =============================================================================

set -euo pipefail

# --- Resolve project root (directory of this script) ------------------------ #
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/lifeos/backend"
FRONTEND_DIR="${SCRIPT_DIR}/lifeos/frontend"
BACKEND_VENV="${BACKEND_DIR}/venv"
BACKEND_PID_FILE="${SCRIPT_DIR}/.backend.pid"
FRONTEND_PID_FILE="${SCRIPT_DIR}/.frontend.pid"
BACKEND_PORT=8000
FRONTEND_PORT=3000

echo "=================================================================="
echo " LIFEOS — Autonomous AI Emergency Operating System"
echo "=================================================================="

# --------------------------------------------------------------------------- #
# 1. Python virtualenv + backend deps
# --------------------------------------------------------------------------- #
echo "[1/6] Preparing Python virtualenv …"
if [ ! -d "${BACKEND_VENV}" ]; then
    python3 -m venv "${BACKEND_VENV}"
fi

# shellcheck disable=SC1091
source "${BACKEND_VENV}/bin/activate" 2>/dev/null || \
    source "${BACKEND_VENV}/Scripts/activate" 2>/dev/null || true

echo "       Upgrading pip …"
pip install --quiet --upgrade pip

echo "       Installing backend requirements …"
pip install --quiet -r "${BACKEND_DIR}/requirements.txt"
deactivate 2>/dev/null || true

# --------------------------------------------------------------------------- #
# 2. Frontend npm packages
# --------------------------------------------------------------------------- #
echo "[2/6] Installing frontend dependencies …"
if [ ! -d "${FRONTEND_DIR}/node_modules" ]; then
    (cd "${FRONTEND_DIR}" && npm install --no-audit --no-fund)
else
    echo "       node_modules already present — skipping npm install"
fi

# --------------------------------------------------------------------------- #
# 3. Spawn backend (background)
# --------------------------------------------------------------------------- #
echo "[3/6] Spawning FastAPI backend on port ${BACKEND_PORT} …"

# Kill any stale process holding the port.
if command -v lsof >/dev/null 2>&1; then
    lsof -ti ":${BACKEND_PORT}" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
fi

nohup "${BACKEND_VENV}/bin/python" "${BACKEND_DIR}/run.py" \
    --host 0.0.0.0 --port "${BACKEND_PORT}" \
    > "${SCRIPT_DIR}/.backend.log" 2>&1 &
echo $! > "${BACKEND_PID_FILE}"
echo "       Backend PID: $(cat "${BACKEND_PID_FILE}")"

# --------------------------------------------------------------------------- #
# 4. Spawn frontend (background)
# --------------------------------------------------------------------------- #
echo "[4/6] Spawning Next.js frontend on port ${FRONTEND_PORT} …"

if command -v lsof >/dev/null 2>&1; then
    lsof -ti ":${FRONTEND_PORT}" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
fi

# Set the API base so the frontend talks to our backend.
export NEXT_PUBLIC_API_URL="http://127.0.0.1:${BACKEND_PORT}"

nohup env NEXT_PUBLIC_API_URL="http://127.0.0.1:${BACKEND_PORT}" \
    npm run dev --prefix "${FRONTEND_DIR}" -- -p "${FRONTEND_PORT}" \
    > "${SCRIPT_DIR}/.frontend.log" 2>&1 &
echo $! > "${FRONTEND_PID_FILE}"
echo "       Frontend PID: $(cat "${FRONTEND_PID_FILE}")"

# --------------------------------------------------------------------------- #
# 5. Poll backend until healthy
# --------------------------------------------------------------------------- #
echo "[5/6] Waiting for backend health check …"
BACKEND_OK=0
for i in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
        BACKEND_OK=1
        break
    fi
    sleep 1
done

if [ "${BACKEND_OK}" -ne 1 ]; then
    echo "ERROR: Backend did not become healthy in time."
    echo "---- backend.log ----"
    cat "${SCRIPT_DIR}/.backend.log" 2>/dev/null || true
    exit 1
fi

echo "       Backend health: OK"
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" | python3 -m json.tool 2>/dev/null \
    || curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health"

# --------------------------------------------------------------------------- #
# 6. Ready notification
# --------------------------------------------------------------------------- #
echo "[6/6] LIFEOS TACTICAL COMMAND ONLINE"
echo "=================================================================="
echo " Frontend (master dashboard):  http://localhost:${FRONTEND_PORT}"
echo " Backend API / health:         http://127.0.0.1:${BACKEND_PORT}/health"
echo " WebSocket live feed:          ws://127.0.0.1:${BACKEND_PORT}/ws"
echo ""
echo " Logs:"
echo "   Backend:  ${SCRIPT_DIR}/.backend.log"
echo "   Frontend: ${SCRIPT_DIR}/.frontend.log"
echo ""
echo " PIDs:"
echo "   Backend:  $(cat "${BACKEND_PID_FILE}")"
echo "   Frontend: $(cat "${FRONTEND_PID_FILE}")"
echo "=================================================================="