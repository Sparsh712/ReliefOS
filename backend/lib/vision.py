"""
lib/vision.py — Google Cloud Vision OCR wrapper.

Sends an image to the Vision API using DOCUMENT_TEXT_DETECTION
(best for handwritten and printed mixed text).

Returns:
    tuple[str, float]: (full OCR text, average confidence score 0–1)
"""

import os
import io
from PIL import Image
from dotenv import load_dotenv

async def extract_text_from_image(image_bytes: bytes) -> tuple[str, float]:
    """
    Call Gemini 2.5 Flash to extract text from the raw image bytes.
    """
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "")

    if not api_key or api_key.startswith("YOUR_"):
        return _mock_ocr_response()

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Convert bytes to PIL Image for Gemini SDK
        image = Image.open(io.BytesIO(image_bytes))

        prompt = "Extract all text from this image exactly as written. Do not add any extra commentary."
        response = model.generate_content([prompt, image])
        
        full_text = response.text.strip()
        # Gemini doesn't return per-word confidence, so we assume high confidence for successful extraction
        avg_confidence = 0.95

        return full_text, avg_confidence
        
    except Exception as e:
        print(f"Gemini OCR Error: {e}")
        return f"CRASH: {str(e)}", 0.0


def _mock_ocr_response() -> tuple[str, float]:
    """
    Realistic mock OCR output for a Delhi dengue field report.
    Used when no Vision API key is configured.
    """
    mock_text = """Date: 15 Nov 2024
Ward: Rohini, Block C
Reported by: Community health worker

Households surveyed: 34
Fever cases (last 7 days): 8
Children affected: 4 (ages 3-12)
Elderly affected: 2

Observations:
- Stagnant water found behind lane 4 and near drain gate
- Water supply pipe leaking near house no. 47
- 2 families report water looks brownish
- Local dispensary out of ORS and paracetamol
- Residents burning garbage near water collection point

Urgency: HIGH - fever cases rising daily
Requesting: medical volunteers, drain cleanup, ORS supply"""

    return mock_text, 0.87
