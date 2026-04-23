"""
routers/upload.py — POST /upload
Accepts an image upload, runs Cloud Vision OCR, stores the report stub.
"""

import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

from models import UploadResponse
from lib.vision import extract_text_from_image

router = APIRouter()


@router.post("", response_model=UploadResponse)
async def upload_report(file: UploadFile = File(...)) -> UploadResponse:
    """
    Accept a handwritten report image and return OCR text.
    Supported formats: JPEG, PNG, WEBP.
    """
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are accepted.")

    image_bytes = await file.read()
    report_id = str(uuid.uuid4())

    ocr_text, confidence = await extract_text_from_image(image_bytes)

    # Store report stub in Firebase Firestore
    import firebase_admin
    from firebase_admin import firestore
    
    if firebase_admin._apps:
        db = firestore.client()
        db.collection("reports").document(report_id).set({
            "report_id": report_id,
            "raw_ocr_text": ocr_text,
            "ocr_confidence": confidence,
            "status": "uploaded",
        })

    return UploadResponse(
        report_id=report_id,
        image_url=f"/uploads/{report_id}",   # placeholder until storage is wired
        raw_ocr_text=ocr_text,
        ocr_confidence=confidence,
    )
