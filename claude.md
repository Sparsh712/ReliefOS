# CLAUDE.md

## Project Overview
ReliefOS is a hackathon MVP for a paper-first anticipatory action engine for NGOs. The system transforms handwritten field reports into structured intelligence, computes short-term dengue/monsoon risk, recommends interventions, and assigns volunteer micro-teams.

## Core MVP Goal
Build one complete workflow:
- Paper report input
- OCR extraction
- Structured JSON generation
- Trust scoring
- Risk scoring
- Intervention recommendation
- Volunteer micro-team assignment
- Optional feedback loop

Primary use case: Delhi dengue / monsoon risk response.

## Product Positioning
ReliefOS should be presented as an intelligence-and-dispatch engine, not a generic NGO dashboard.

Key differentiation:
- Paper-first data ingestion
- Explainable AI outputs
- Trust-aware report interpretation
- Anticipatory risk scoring
- Action-oriented intervention planning

## Recommended Stack
- Frontend: Next.js or React
- Backend: FastAPI or Node.js
- OCR: Google Cloud Vision or Gemini paper understanding
- Structured extraction: Gemini / Vertex AI
- Maps and ETA: Google Maps Routes API
- Storage: Firebase or Supabase
- Forecast layer: Python microservice with lightweight risk scoring logic

## Build Target
The MVP must prove this loop:

paper report in -> risk score generated -> intervention recommended -> volunteer micro-team assigned

Keep scope limited to one demoable workflow around Delhi dengue/monsoon field reports.

## System Modules

### 1. Ingestion
Create an input layer where NGO staff can upload:
- photo of a handwritten survey
- scanned field form
- optional Hindi/English voice note if time remains

Input should support low-friction field usage.

### 2. Extraction
After OCR, convert raw text into a strict structured schema.

Extract fields such as:
- location
- ward
- household count
- symptoms / fever cases
- stagnant water
- water contamination
- medicine shortage
- urgency
- vulnerable groups

Use Gemini to normalize OCR output into JSON.

### 3. Trust Scoring
Each report must get a trust/confidence score.

MVP heuristic inputs:
- OCR confidence
- missing field rate
- repeated evidence patterns
- report recency
- source type
- cross-report agreement for same area

Important: extracted output should never be treated as perfectly reliable.

### 4. Risk Engine
Fuse extracted report data with simple external signals such as:
- rainfall forecast
- ward geography
- repeat reports from same locality

Produce a short-term hotspot score for next 7 days.

### 5. Intervention Recommender
Map risk patterns to concrete interventions, for example:
- awareness drive
- ORS distribution
- drain cleanup
- medical volunteer visit
- water filtration response

Ranking should be based on practical usefulness, not black-box modeling.

### 6. Swarm Allocation
Assign small teams of 5 to 8 volunteers based on:
- skill
- distance
- urgency
- availability
- language

Use Google Maps Routes API or mock ETA logic for deployment planning.

### 7. Feedback Loop
After task completion, capture:
- people reached
- issue resolved yes/no
- photos or voice summary
- remaining problems

Use this to slightly update hotspot score or intervention confidence.

## Suggested Architecture

### Frontend
- NGO dashboard in Next.js or React
- simple volunteer task view

### Backend
- FastAPI or Node.js API layer
- handles uploads, OCR calls, extraction jobs, risk scoring, recommendations

### Storage
- Firebase or Supabase
- keep reports, volunteers, interventions, deployments

### AI Layer
- Google Cloud Vision OCR for image text extraction
- Gemini / Vertex AI for structured JSON extraction and explanation generation

### Maps Layer
- Google Maps Routes API for ETA and route planning

### Forecast Layer
- lightweight Python service for next-7-day risk estimate
- use transparent weighted scoring before considering any time-series model

## Database Design
Only 5 main tables/collections are needed.

### reports
- image_url
- raw_ocr_text
- extracted_json
- trust_score
- timestamp
- ward
- lat
- lng

### signals
- ward
- date
- rainfall
- context_features

### volunteers
- name
- skills
- home_location
- availability
- language
- current_load

### interventions
- type
- trigger_conditions
- recommended_skill_mix
- expected_impact_score

### deployments
- deployment_id
- assigned_volunteers
- target_zone
- route_eta
- status
- feedback_summary

## Implementation Phases

### Phase 1: Define Schema
Before coding AI, define one strict JSON schema for extracted paper reports.

Example fields:
- report_id
- location_text
- ward
- geo_hint
- households_affected
- fever_cases
- stagnant_water
- medicine_shortage
- water_quality_issue
- vulnerable_groups
- urgency_level
- source_notes
- extraction_confidence

### Phase 2: Build Upload + OCR
Build a page where NGO staff can upload an image and immediately see:
- original image
- OCR text
- extracted structured fields
- confidence / trust score

This is the first visible demo milestone.

### Phase 3: Add Structured Extraction
Pass OCR text plus optional image context into Gemini.
Request structured JSON output matching the schema.

If possible, include a manual review/edit panel so users can correct extracted values.

### Phase 4: Add Hotspot Scoring
Implement a simple weighted model.

Rules:
- more fever mentions = higher dengue risk
- stagnant water + rain forecast = much higher risk
- repeated reports in same area = stronger priority
- recent reports should matter more than older ones

Weighted formulas are enough for MVP.

### Phase 5: Add Intervention Ranking
Create a deterministic rules table.

Examples:
- high stagnant water + moderate fever -> drain cleanup + awareness
- high fever + child vulnerability -> ORS + medical volunteers
- water contamination -> water testing / filtration response

Use ranking logic such as:

score = risk_severity * trust * intervention_fit / travel_cost

### Phase 6: Add Volunteer Allocation
Volunteers should include:
- skill tags
- location
- availability
- max task load
- language

Allocate nearest feasible teams and estimate ETA.

### Phase 7: Add Explanation Layer
Every recommendation should explain itself in plain language.

Example:
"Ward X prioritized because 4 recent reports mention fever, 3 mention stagnant water, rain forecast is high, and a nearby team can reach in 18 minutes."

### Phase 8: Add Feedback + Closed Loop
After task completion, ask for:
- people reached
- issue resolved yes/no
- photos or voice summary
- remaining problems

Use these to update status and slightly adjust area risk.

## 7-Day Full Plan
If there were a full 7-day build window, the sequence would be:

### Day 1
- finalize use case
- define schema
- create UI wireframe
- create mock data set for 20 to 30 reports

### Day 2
- build upload flow
- OCR integration
- report storage
- extracted text viewer

### Day 3
- Gemini structured extraction
- editable JSON panel
- trust score logic

### Day 4
- risk engine
- hotspot dashboard
- ward cards or map overlays

### Day 5
- intervention ranking
- volunteer assignment
- route ETA estimation

### Day 6
- feedback loop
- explanation panel
- full end-to-end demo story

### Day 7
- UI polish
- compelling seeded demo data
- pitch practice
- before/after scenario prep

## Compressed 2-Day Delivery Guidance
Because submission is near, compress scope.

### Day 1
- setup repo
- build upload screen
- integrate OCR
- integrate Gemini extraction
- display structured JSON

### Day 2
- add trust score
- add risk engine
- add intervention rules
- add volunteer assignment
- polish UI
- record demo
- prepare submission assets

## Team Split
If working with 3 to 4 people:

### AI/ML
- OCR
- Gemini extraction
- trust score
- hotspot logic

### Backend
- APIs
- DB schema
- report/intervention/deployment services

### Frontend
- NGO dashboard
- report review
- hotspot view
- task board

### Product / Demo
- data collection
- demo script
- pitch
- workflow framing

## UI Screens to Build
Only build these 5 screens:

1. Upload report
   - image upload
   - OCR preview
   - structured extraction preview

2. Hotspot dashboard
   - risk-ranked wards or neighborhoods

3. Intervention planner
   - recommended action
   - rationale

4. Volunteer swarm view
   - assigned micro-team
   - ETA
   - route or mock route

5. Feedback screen
   - completed action
   - post-task notes

## Tech Choices Recommended
For a Google-oriented hackathon:
- Frontend: Next.js
- Backend: FastAPI
- DB/Auth: Firebase
- OCR: Google Cloud Vision DOCUMENT_TEXT_DETECTION
- Extraction / reasoning: Gemini via Vertex AI or Gemini API
- Maps: Google Maps Routes API
- Hosting: Firebase Hosting or Vercel for frontend, Render or Cloud Run for backend

## Important Simplifications
Do not try to build:
- federated learning
- full causal inference
- real multilingual speech pipeline
- fine-tuned forecasting models
- live NGO integrations

A believable end-to-end workflow is more valuable than a half-built complex system.

## Demo Flow
The demo should follow this order:
1. Upload handwritten field report
2. Show OCR output
3. Show structured extraction
4. Show trust score and hotspot increase
5. Show top intervention recommendation with explanation
6. Show volunteer swarm assigned with ETA
7. Submit feedback and show hotspot score improve

This should feel cinematic, clear, and technically strong.

## Success Metrics
Track 4 metrics in the demo:
- OCR to structured extraction accuracy on sample set
- time from report upload to intervention suggestion
- average ETA reduction from volunteer selection
- number of at-risk households flagged before manual escalation

Even with pilot or mock data, these metrics create outcome credibility.

## Blunt Product Recommendation
Keep the product narrowly focused as an intelligence-and-dispatch engine.
Do not try to become a full NGO platform.

Build one polished workflow around Delhi dengue / monsoon field reports using:
- Google OCR
- Gemini structured extraction
- routes / ETA layer
- strong explanation layer

## Novelty Features to Add
To make the project stand out, add these layers:

### 1. Trust Score Engine
Do not just extract reports.
Score their reliability using:
- OCR quality
- completeness
- corroboration with nearby reports
- consistency with weather / locality context

Show:
- trust percentage
- confidence label

### 2. Escalation Clock
Instead of only a static risk score, estimate:
- how fast the area could move from medium to high risk
- for example: "Likely to escalate in 4 days if no action is taken"

### 3. Minimum Effective Intervention
Recommend the smallest action likely to prevent escalation.
Example:
- 2 sanitation volunteers + 1 awareness worker for 90 minutes

This makes the system feel resource-optimized.

### 4. Evidence Trail
Show a panel called "Why this decision?"
Include:
- key facts extracted from report
- corroborating context signal
- reason intervention was chosen

### 5. Silent-Zone Detection
If a ward has weak or sparse reporting but nearby stronger reports indicate rising risk, flag it as:
- underreported zone
- manual verification needed

This gives the system a stronger anticipatory edge.

## Best Novelty Set for Tight Timeline
If time is short, prioritize only these 3:
- Trust Score
- Escalation Clock
- Evidence Trail

These provide the strongest novelty-to-effort ratio.

## Strong USP Statement
ReliefOS is a paper-first anticipatory action engine that not only reads handwritten field reports, but also scores their reliability, predicts escalation windows, and recommends the minimum effective intervention before a crisis spreads.

## Suggested Folder Structure
```txt
reliefos/
  app/
    page.tsx
    upload/
    dashboard/
    intervention/
    dispatch/
    feedback/
    components/
  lib/
    vision.ts
    gemini.ts
    risk.ts
    trust.ts
    interventions.ts
    volunteers.ts
    eta.ts
  data/
    volunteers.json
    wards.json
    sample-reports.json
  public/
    sample-reports/
  styles/
```

## Core Utility Modules
### vision.ts
- accepts image upload
- sends to OCR service
- returns raw OCR text

### gemini.ts
- sends OCR text to Gemini
- returns validated JSON

### trust.ts
- computes trust score based on heuristics

### risk.ts
- computes hotspot score and escalation window

### interventions.ts
- ranks interventions based on extracted signals

### volunteers.ts
- selects volunteer team based on skills and availability

### eta.ts
- computes ETA via route logic or mocked data

## Definition of Done
The MVP is done when:
- user uploads a handwritten report
- OCR text appears
- structured JSON appears
- trust score appears
- hotspot risk score appears
- escalation window appears
- recommendation appears
- volunteer team appears as dispatched

Everything else is optional.
