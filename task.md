# ReliefOS — Full Implementation Checklist

> Every task needed to ship the hackathon MVP.  
> Each item has **tech stack**, **owner hint**, and **file(s)**.  
> Confirmed defaults: **FastAPI** backend, **Firebase Firestore** storage, **Tailwind v3**, **mocked ETA**.

---

## Phase 0: Project Initialization

### Frontend Setup
- [x] Initialize Next.js project with App Router (`npx -y create-next-app@latest ./frontend`)
  - **Tech:** Next.js 14, TypeScript
- [x] Install and configure Tailwind CSS v3
  - **Tech:** Tailwind CSS v3, PostCSS, Autoprefixer
- [x] Set up folder structure: `app/upload/`, `app/dashboard/`, `app/intervention/`, `app/dispatch/`, `app/feedback/`, `app/components/`
  - **Tech:** File system
- [x] Configure Google Font (Inter) via `next/font`
  - **Tech:** next/font, Google Fonts
- [x] Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`
  - **Tech:** Next.js env

### Backend Setup
- [x] Initialize FastAPI project in `backend/` with `main.py`
  - **Tech:** FastAPI, Python 3.11+, uvicorn
- [x] Configure CORS in `main.py` to allow requests from Next.js (`localhost:3000`)
  - **Tech:** FastAPI `CORSMiddleware`
- [x] Create `models.py` — all shared Pydantic models (single source of truth)
  - **Models:** `ExtractedReport`, `TrustResult`, `RiskResult`, `Intervention`, `Volunteer`, `DispatchPlan`, `FeedbackInput`
  - **Tech:** Pydantic v2
- [x] Create router modules: `routers/upload.py`, `routers/extract.py`, `routers/trust.py`, `routers/risk.py`, `routers/interventions.py`, `routers/dispatch.py`, `routers/feedback.py`
  - **Tech:** FastAPI Router
- [x] Create library modules: `lib/vision.py`, `lib/gemini.py`, `lib/trust.py`, `lib/risk.py`, `lib/interventions.py`, `lib/volunteers.py`, `lib/eta.py`
  - **Tech:** Python
- [x] Create `requirements.txt` (fastapi, uvicorn, google-cloud-vision, google-generativeai, firebase-admin, python-multipart, pydantic, python-dotenv)
  - **Tech:** pip
- [x] Create `.env` with API keys (Vision key, Gemini key, Firebase credentials)
  - **Tech:** python-dotenv

### Storage Setup
- [ ] Create Firebase project + enable Firestore in Google Cloud Console
  - **Tech:** Firebase Console
- [ ] Create 5 Firestore collections: `reports`, `signals`, `volunteers`, `interventions`, `deployments`
  - **Tech:** Firestore
- [ ] Download Firebase service account JSON + initialize Firebase Admin in `main.py`
  - **Tech:** firebase-admin Python SDK

### Shared Types / Models
- [x] Define TypeScript interfaces in frontend (`lib/types.ts`) mirroring backend Pydantic models
  - **Tech:** TypeScript

---

## Phase 1: Upload + OCR Pipeline

### Backend
- [x] Implement `lib/vision.py` — Google Cloud Vision wrapper
  - **Tech:** Google Cloud Vision API (`DOCUMENT_TEXT_DETECTION`)
  - **Input:** Base64 image bytes
  - **Output:** Raw OCR text + per-block confidence scores
- [x] Create `POST /upload` route in `routers/upload.py`
  - Accepts multipart image upload
  - Calls `vision.py`
  - Stores report stub in Firestore
  - Returns OCR text + image URL
  - **Tech:** FastAPI, python-multipart

### Frontend
- [x] Build `UploadDropzone.tsx` — drag-and-drop image upload
  - **Tech:** React, HTML5 drag-and-drop API
- [x] Add image preview on file selection
  - **Tech:** React state, `URL.createObjectURL`
- [x] Add "Analyze Report" submit button with loading spinner
  - **Tech:** React, Tailwind
- [x] Add sample report quick-load buttons (3 pre-loaded images)
  - **Tech:** React, Next.js static assets
- [x] Build Upload Page (`app/upload/page.tsx`)
  - **Tech:** Next.js App Router
- [x] Wire upload → `POST /upload` → display OCR text
  - **Tech:** fetch API

---

## Phase 2: Gemini Structured Extraction

### Backend
- [x] Implement `lib/gemini.py` — Gemini API wrapper
  - **Tech:** `google-generativeai` Python SDK
- [x] Embed extraction prompt requesting strict JSON matching schema
  - **Fields:** report_id, location_text, ward, geo_hint, households_affected, fever_cases, stagnant_water, medicine_shortage, water_quality_issue, vulnerable_groups, urgency_level, source_notes, extraction_confidence
  - **Tech:** Prompt engineering
- [x] Parse + validate Gemini response against Pydantic model
  - **Tech:** Pydantic, JSON
- [x] Handle: malformed JSON, missing fields, API errors
  - **Tech:** Python error handling
- [x] Create `POST /extract` route in `routers/extract.py`
  - **Tech:** FastAPI

### Frontend
- [x] Build `OcrPreview.tsx` — raw OCR text display panel
  - **Tech:** React, Tailwind
- [x] Build `ExtractionReview.tsx` — structured fields as labeled cards
  - **Tech:** React, Tailwind
- [x] Build editable fields mode (if time allows) — user can correct extracted values
  - **Tech:** React controlled inputs
- [x] Wire OCR text → `POST /extract` → display structured JSON
  - **Tech:** fetch API

---

## Phase 3: Trust Scoring (⭐ Novelty Feature #1)

### Backend
- [x] Implement `lib/trust.py` — heuristic trust scoring
  - **Inputs:**
    - OCR confidence from Vision API
    - Missing field rate (`null` fields / total fields)
    - Repeated evidence patterns within report
    - Report recency (hours since submission)
    - Cross-report agreement (same ward, similar signals)
  - **Output:** `{ trust_score: 0-1, confidence_label: "High"/"Medium"/"Low", factors: [] }`
  - **Tech:** Python (pure logic)
- [x] Create `POST /trust` route in `routers/trust.py`
  - **Tech:** FastAPI

### Frontend
- [x] Build `TrustBadge.tsx` — colored badge (green ≥0.7 / yellow ≥0.4 / red <0.4) + percentage
  - **Tech:** React, Tailwind
- [x] Show trust factors breakdown in tooltip or expandable section
  - **Tech:** React

---

## Phase 4: Risk Engine + Escalation Clock (⭐ Novelty Feature #2)

### Backend
- [x] Implement `lib/risk.py` — weighted hotspot scoring
  - **Formula:** fuse fever_cases, stagnant_water, water_contamination, medicine_shortage, urgency, rain_multiplier, cross-report corroboration
  - **Output:** score (0–100) + label (Low/Medium/High) + explanation string
  - **Tech:** Python
- [x] Define ward data in `data/wards.json` — ward names, rain multipliers, coordinates
  - **Tech:** JSON static data
- [x] Implement escalation clock logic
  - Estimate days until area risk moves from current level to next level
  - Example: "Likely to escalate to High in ~4 days if no action taken"
  - **Tech:** Python (simple heuristic based on signal velocity)
- [x] Create `POST /risk` route in `routers/risk.py`
  - **Tech:** FastAPI

### Frontend
- [x] Build `RiskGauge.tsx` — large score gauge (0–100) with color gradient
  - **Tech:** React, CSS/SVG
- [x] Add risk label badge (Low/Medium/High)
  - **Tech:** React, Tailwind
- [x] Build `EscalationClock.tsx` — countdown-style display showing days-to-escalation
  - **Tech:** React, Tailwind
- [x] Add explanation card listing contributing factors
  - **Tech:** React, Tailwind
- [x] Build Hotspot Dashboard page (`app/dashboard/page.tsx`)
  - Risk-ranked ward cards
  - Each card: ward name, score, label, escalation clock
  - **Tech:** Next.js

---

## Phase 5: Intervention Recommendation + Evidence Trail (⭐ Novelty Feature #3)

### Backend
- [x] Implement `lib/interventions.py` — deterministic rule engine
  - **Rules:**
    - stagnant_water + fever ≥ 3 → drain cleanup + awareness
    - fever ≥ 5 + children in vulnerable_groups → ORS + medical visit
    - water_quality_issue → safe water kit + field inspection
    - medicine_shortage → pharmacy support / restocking
  - **Ranking:** `score = risk_severity × trust × intervention_fit / travel_cost`
  - **Minimum Effective Intervention:** recommend smallest team/action likely to prevent escalation
  - **Tech:** Python
- [x] Generate evidence trail per recommendation: key facts, context signals, reasoning
  - **Tech:** Python string/dict building
- [x] Create `POST /interventions` route in `routers/interventions.py`
  - **Tech:** FastAPI

### Frontend
- [x] Build `InterventionCard.tsx` — card with title, rationale, urgency, team needs
  - **Tech:** React, Tailwind
- [x] Highlight primary recommendation, show 2 alternatives
  - **Tech:** React, Tailwind
- [x] Build `EvidenceTrail.tsx` — "Why this decision?" panel
  - Lists: extracted facts, corroborating signals, reasoning chain
  - **Tech:** React, Tailwind
- [x] Build Intervention Planner page (`app/intervention/page.tsx`)
  - **Tech:** Next.js

---

## Phase 6: Volunteer Dispatch + ETA

### Backend
- [x] Create `data/volunteers.json` — mock volunteer data (8–10 volunteers)
  - **Fields:** name, skills[], home_location, availability, language, current_load, max_task_load
  - **Tech:** JSON static data
- [x] Implement `lib/volunteers.py` — team matching
  - Filter by: skill match, availability, load capacity, language
  - Sort by: area proximity, current load
  - Select micro-team of 3–5
  - **Tech:** Python
- [x] Implement `lib/eta.py` — mocked ETA computation
  - same ward = 15 min, adjacent ward = 25 min, far ward = 40 min
  - Comment-stub for Routes API swap if key becomes available
  - **Tech:** Python (pure mock logic)
- [x] Create `POST /dispatch` route in `routers/dispatch.py`
  - Store deployment in Firestore
  - **Tech:** FastAPI

### Frontend
- [x] Build `DispatchPanel.tsx` — volunteer team cards (name, skills, area, language)
  - **Tech:** React, Tailwind
- [x] Add task brief summary card
  - **Tech:** React, Tailwind
- [x] Add ETA display (minutes + clock icon)
  - **Tech:** React, Tailwind
- [x] Add "Confirm Dispatch" button → success state with checkmark animation
  - **Tech:** React, CSS transitions
- [x] Build Dispatch page (`app/dispatch/page.tsx`)
  - **Tech:** Next.js

---

## Phase 7: Feedback Loop

### Backend
- [x] Create `POST /feedback` route in `routers/feedback.py`
  - Accept: people_reached, resolved (y/n), remaining_issues, notes
  - Update deployment status in Firestore
  - Slightly adjust ward risk score (+/- based on resolution)
  - **Tech:** FastAPI, Firestore

### Frontend
- [x] Build `FeedbackForm.tsx` — post-task form
  - Fields: people reached (number), issue resolved (toggle), remaining issues (text), optional photo
  - **Tech:** React, Tailwind
- [x] Show updated risk score after feedback submission
  - **Tech:** React
- [x] Build Feedback page (`app/feedback/page.tsx`)
  - **Tech:** Next.js

---

## Phase 8: Cross-Cutting UI & Navigation

- [x] Build `Header.tsx` — ReliefOS branding, minimal nav links
  - **Tech:** React, Tailwind
- [x] Build root `layout.tsx` with header
  - **Tech:** Next.js App Router
- [x] Build `StepProgress.tsx` — horizontal pipeline indicator
  - Steps: Upload → Extract → Trust → Risk → Intervene → Dispatch → Feedback
  - **Tech:** React, CSS
- [x] Configure `globals.css` with Tailwind base + design tokens
  - Neutral palette + one accent color (e.g., slate + amber)
  - **Tech:** Tailwind CSS, CSS custom properties
- [x] Add loading spinners/skeletons between pipeline stages
  - **Tech:** React, Tailwind
- [x] Add error handling UI (inline alerts for API failures)
  - **Tech:** React
- [x] Ensure responsive layout (desktop-first, basic mobile)
  - **Tech:** Tailwind responsive classes

---

## Phase 9: Demo Data & Polish

- [ ] Create/source 3 sample handwritten field report images in `/public/sample-reports/`
  - **Tech:** Image files (PNG/JPG)
- [ ] Seed `data/sample-reports.json` with 3 pre-extracted report records
  - **Tech:** JSON
- [ ] Seed `data/wards.json` with 5 Delhi wards + rain multipliers
  - Rohini: 1.4, Dwarka: 1.2, Seelampur: 1.3, Laxmi Nagar: 1.1, Najafgarh: 1.35
  - **Tech:** JSON
- [ ] Seed `data/volunteers.json` with 8–10 mock volunteers
  - **Tech:** JSON
- [ ] Test full pipeline end-to-end with each sample report
  - **Tech:** Manual testing
- [ ] Ensure upload-to-dispatch flow < 60 seconds
  - **Tech:** Performance check
- [ ] Run `npm run build` (frontend) — zero errors
  - **Tech:** Next.js, TypeScript
- [ ] Test FastAPI with `uvicorn main:app --reload`
  - **Tech:** FastAPI
- [ ] Deploy frontend to Vercel + backend to Render/Cloud Run
  - **Tech:** Vercel CLI, Docker/Cloud Run

---

## Phase 10: Stretch Goals (Only If Time Remains)

- [ ] **Silent-Zone Detection** — flag underreported wards with nearby rising risk
  - **Tech:** Python heuristic in `risk.py`
- [ ] **Hindi OCR** sample report examples
  - **Tech:** Cloud Vision multilingual
- [ ] **Editable extracted fields** in extraction review
  - **Tech:** React controlled inputs
- [ ] **Mini ward leaderboard** on dashboard
  - **Tech:** React, Tailwind
- [ ] **Before/after simulation** — show risk change if intervention is deployed
  - **Tech:** React, mock data
- [ ] **Map placeholder** — ward boundaries or pin markers
  - **Tech:** Google Maps JS API or static image

---

## Tech Stack Summary

| Category | Technology | Notes |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | TypeScript, App Router |
| **Styling** | Tailwind CSS **v3** | Stable, well-documented |
| **Backend** | **FastAPI** (Python 3.11+) | Async, AI-friendly, confirmed |
| **OCR** | Google Cloud Vision API | `DOCUMENT_TEXT_DETECTION` |
| **LLM** | Gemini API | `google-generativeai` SDK |
| **ETA** | **Mocked** (15/25/40 min) | Swap for Routes API if key available |
| **Storage** | **Firebase Firestore** | 5 collections, confirmed |
| **Auth** | None (hackathon MVP) | — |
| **Fonts** | Inter (Google Fonts) | via `next/font` |
| **Hosting (FE)** | **Vercel** | Free tier, fastest CI |
| **Hosting (BE)** | **Render** | Free tier, Docker or direct deploy |

---

## Key Files Map

### Backend (`backend/`)
| File | Purpose | Tech |
|---|---|---|
| `main.py` | FastAPI entrypoint, CORS, router mounting | FastAPI |
| `routers/upload.py` | `POST /upload` — image → OCR | FastAPI |
| `routers/extract.py` | `POST /extract` — OCR → JSON | FastAPI |
| `routers/trust.py` | `POST /trust` — trust scoring | FastAPI |
| `routers/risk.py` | `POST /risk` — hotspot + escalation | FastAPI |
| `routers/interventions.py` | `POST /interventions` — ranking | FastAPI |
| `routers/dispatch.py` | `POST /dispatch` — team assignment | FastAPI |
| `routers/feedback.py` | `POST /feedback` — close loop | FastAPI |
| `lib/vision.py` | Cloud Vision OCR wrapper | google-cloud-vision |
| `lib/gemini.py` | Gemini extraction + prompt | google-generativeai |
| `lib/trust.py` | Trust scoring heuristics | Python |
| `lib/risk.py` | Risk formula + escalation clock | Python |
| `lib/interventions.py` | Rule-based recommendation | Python |
| `lib/volunteers.py` | Team matching | Python |
| `lib/eta.py` | ETA computation | Routes API / mock |
| `data/volunteers.json` | Mock volunteer data | JSON |
| `data/wards.json` | Ward metadata + multipliers | JSON |
| `data/sample-reports.json` | Seeded sample reports | JSON |

### Frontend (`frontend/`)
| File | Purpose | Tech |
|---|---|---|
| `app/page.tsx` | Landing → redirects to upload | Next.js |
| `app/upload/page.tsx` | Upload flow | Next.js |
| `app/dashboard/page.tsx` | Hotspot dashboard | Next.js |
| `app/intervention/page.tsx` | Intervention planner | Next.js |
| `app/dispatch/page.tsx` | Volunteer swarm view | Next.js |
| `app/feedback/page.tsx` | Feedback screen | Next.js |
| `app/components/UploadDropzone.tsx` | Image upload widget | React |
| `app/components/TrustBadge.tsx` | Trust score display | React |
| `app/components/RiskGauge.tsx` | Risk score gauge | React |
| `app/components/EscalationClock.tsx` | Time-to-escalation | React |
| `app/components/EvidenceTrail.tsx` | "Why this decision?" | React |
| `app/components/InterventionCard.tsx` | Recommendation card | React |
| `app/components/DispatchPanel.tsx` | Volunteer team panel | React |
| `app/components/FeedbackForm.tsx` | Post-task form | React |

---

> **Total items: ~75 tasks**  
> **Must-have (MVP): ~60 tasks** (Phases 0–9)  
> **Stretch: ~6 tasks** (Phase 10)  
> **Novelty features baked in: Trust Score ⭐, Escalation Clock ⭐, Evidence Trail ⭐**
