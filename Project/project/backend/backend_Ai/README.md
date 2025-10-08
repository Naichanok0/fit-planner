# Mock AI Backend (backend_Ai)

This folder contains a lightweight FastAPI mock server (`mock_main.py`) that implements the minimal
endpoints used by the frontend during development: `/pose/`, `/analyze/`, `/chest/`, and `/api/programs`.

When the real backend requires native dependencies (OpenCV, FAISS), use this mock for quick local testing.

How to run (Windows PowerShell):

1. Open PowerShell or Command Prompt.
2. Change directory to this folder:

   Set-Location -LiteralPath 'C:\Users\User\Documents\fit-planner\Project\project\backend\backend_Ai'

3. Create and activate a virtual environment (optional but recommended):

   python -m venv .venv; .\.venv\Scripts\Activate.ps1

4. Install dependencies (FastAPI + Uvicorn):

   pip install fastapi uvicorn

5. Run the mock server:

   python .\mock_main.py

The mock server listens on http://127.0.0.1:8000 by default.

If you use the frontend dev server, set `VITE_API_BASE` or `VITE_AI_BASE` to `http://127.0.0.1:8000`.
