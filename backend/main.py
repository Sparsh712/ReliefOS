"""
main.py — ReliefOS FastAPI entrypoint.
Mounts all routers and configures CORS for the Next.js frontend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import upload, extract, trust, risk, interventions, dispatch, feedback

app = FastAPI(
    title="ReliefOS API",
    description=(
        "Paper-first anticipatory action engine. "
        "Converts handwritten NGO field reports into risk scores, "
        "intervention plans, and volunteer dispatch orders."
    ),
    version="0.1.0",
)

import os
import firebase_admin
from firebase_admin import credentials

# ─── Firebase Init ────────────────────────────────────────────────────────────
project_id = os.getenv("FIREBASE_PROJECT_ID")
if not firebase_admin._apps and project_id and not project_id.startswith("YOUR_"):
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": project_id,
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "token_uri": "https://oauth2.googleapis.com/token",
    })
    firebase_admin.initialize_app(cred)
    print("Firebase Admin initialized successfully from environment variables.")


# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allow the Next.js dev server and Vercel preview URLs.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(upload.router,        prefix="/upload",        tags=["OCR"])
app.include_router(extract.router,       prefix="/extract",       tags=["Extraction"])
app.include_router(trust.router,         prefix="/trust",         tags=["Trust"])
app.include_router(risk.router,          prefix="/risk",          tags=["Risk"])
app.include_router(interventions.router, prefix="/interventions", tags=["Interventions"])
app.include_router(dispatch.router,      prefix="/dispatch",      tags=["Dispatch"])
app.include_router(feedback.router,      prefix="/feedback",      tags=["Feedback"])


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "ReliefOS API", "version": "0.1.0"}
