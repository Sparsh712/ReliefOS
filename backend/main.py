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

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allow the Next.js dev server and Vercel preview URLs.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",   # Vercel preview deployments
    ],
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
