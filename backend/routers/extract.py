"""
routers/extract.py — POST /extract
Takes OCR text and runs Gemini structured extraction.
"""

from fastapi import APIRouter, HTTPException

from models import ExtractRequest, ExtractedReport
from lib.gemini import extract_structured_report

router = APIRouter()


@router.post("", response_model=ExtractedReport)
async def extract_report(req: ExtractRequest) -> ExtractedReport:
    """
    Send OCR text to Gemini and return a validated ExtractedReport JSON.
    """
    if not req.raw_ocr_text.strip():
        raise HTTPException(status_code=400, detail="OCR text is empty.")

    report = await extract_structured_report(
        report_id=req.report_id,
        ocr_text=req.raw_ocr_text,
    )
    return report
