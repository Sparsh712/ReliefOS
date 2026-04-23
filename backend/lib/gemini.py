"""
lib/gemini.py — Gemini API structured extraction.

Sends OCR text to Gemini with a strict JSON schema prompt.
Validates the response against the ExtractedReport Pydantic model.
Falls back to a realistic mock if no key is configured.
"""

import os
import json
import uuid
import re
from dotenv import load_dotenv

from models import ExtractedReport

load_dotenv()

# Extraction prompt — strict, schema-bound
EXTRACTION_PROMPT = """You are extracting structured disaster-risk information from OCR text taken from handwritten NGO field reports in India.

Return ONLY valid JSON. Do not add markdown. Do not add explanation.

Required fields:
- report_id (string, use the value provided)
- location_text (string or null — free-text location description)
- ward (string or null — ward/block name)
- geo_hint (string or null — any address, sector, or landmark hint)
- households_surveyed (integer or null — count of households surveyed or visited)
- households_affected (integer or null — count of households negatively affected)
- fever_cases (integer or null — count of fever cases mentioned)
- stagnant_water (boolean or null — true if stagnant water is mentioned)
- medicine_shortage (boolean or null — true if medicine/ORS shortage mentioned)
- water_quality_issue (boolean or null — true if water contamination/quality mentioned)
- vulnerable_groups (array of strings — e.g. ["children", "elderly"])
- urgency_level (one of: "low", "medium", "high", or null)
- source_notes (string or null — any extra useful context)
- extraction_confidence (float 0.0 to 1.0 — your confidence in the extraction)

Rules:
- If a value is unknown, use null.
- urgency_level must be exactly "low", "medium", or "high".
- vulnerable_groups must be an array (empty array if none mentioned).
- Infer values only when strongly supported by the text.
- Do not hallucinate numbers not present in the text.
"""


async def extract_structured_report(report_id: str, ocr_text: str) -> ExtractedReport:
    """
    Send OCR text to Gemini and return a validated ExtractedReport.
    Falls back to mock if no API key is set.
    """
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "")

    if not api_key or api_key.startswith("YOUR_"):
        return _mock_extraction(report_id, ocr_text)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")

        prompt = f"{EXTRACTION_PROMPT}\n\nReport ID: {report_id}\n\nOCR Text:\n{ocr_text}"
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)
        data["report_id"] = report_id   # ensure report_id is always set
        return ExtractedReport(**data)

    except Exception as e:
        return ExtractedReport(
            report_id=report_id,
            location_text=f"ERROR: {str(e)[:100]}",
            ward="ERROR",
            geo_hint=None,
            households_affected=None,
            fever_cases=None,
            stagnant_water=None,
            medicine_shortage=None,
            water_quality_issue=None,
            vulnerable_groups=[],
            urgency_level=None,
            source_notes=f"Gemini extraction failed: {str(e)}",
            extraction_confidence=0.0
        )


def _mock_extraction(report_id: str, ocr_text: str) -> ExtractedReport:
    """
    Parse the mock OCR text into a realistic ExtractedReport.
    Covers the demo scenario: Rohini dengue/monsoon high-risk report.
    """
    text_lower = ocr_text.lower()

    return ExtractedReport(
        report_id=report_id,
        location_text="Rohini Block C, Lane 4 area",
        ward="Rohini",
        geo_hint="Block C, near drain gate",
        households_surveyed=34,
        households_affected=None,
        fever_cases=8,
        stagnant_water="stagnant" in text_lower or "drain" in text_lower,
        medicine_shortage="ors" in text_lower or "paracetamol" in text_lower or "shortage" in text_lower,
        water_quality_issue="brownish" in text_lower or "contamination" in text_lower or "leaking" in text_lower,
        vulnerable_groups=["children", "elderly"] if ("children" in text_lower or "elderly" in text_lower) else [],
        urgency_level="high" if "high" in text_lower else "medium",
        source_notes="Community health worker field report. Garbage burning near water source noted.",
        extraction_confidence=0.87,
    )
