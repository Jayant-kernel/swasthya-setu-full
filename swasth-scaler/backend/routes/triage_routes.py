from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import json
import httpx
import logging
from openai import OpenAI

from database import get_db
from models import TriageRecord
from schemas import TriageCreate
from auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

TRIAGE_SYSTEM_PROMPT = """
You are a rural healthcare triage assistant for ASHA workers
in Odisha, India. Apply WHO IMNCI triage rules.

RED (Emergency - refer immediately):
- Unable to drink or feed
- Convulsions or fits
- Abnormally sleepy or unconscious
- High fever with stiff neck
- Severe chest indrawing
- Severe malnutrition
- Infant under 2 months with any danger sign

YELLOW (Moderate - treat and monitor):
- Fever for 2-3 days without danger signs
- Fast breathing without severe signs
- Moderate dehydration
- Not eating normally

GREEN (Mild - home care):
- Mild cough or cold
- No danger signs
- Feeding normally

ODISHA SICKLE CELL RULE:
If district is in [Koraput, Malkangiri, Rayagada, Kalahandi,
Kandhamal, Nabarangpur, Mayurbhanj] AND symptoms include
fever AND (joint pain OR fatigue OR jodo dard OR thakaan):
Force severity=red, sickle_cell_risk=true

Return ONLY valid JSON no markdown:
{"patient_name": "extracted name or empty string", "symptoms": [], "severity": "green|yellow|red",
 "sickle_cell_risk": false, "brief": ""}
"""

@router.get("/")
async def get_triage_records(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(TriageRecord).order_by(TriageRecord.created_at.desc())
    if current_user["role"] == "asha":
        query = query.where(TriageRecord.user_id == current_user["id"])
    elif current_user["role"] == "tho" and current_user.get("district"):
        query = query.where(TriageRecord.district == current_user["district"])
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/")
async def create_triage_record(record: TriageCreate, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_record = TriageRecord(
        patient_id=record.patient_id,
        patient_name=record.patient_name,
        symptoms=record.symptoms,
        severity=record.severity,
        sickle_cell_risk=record.sickle_cell_risk,
        brief=record.brief,
        tehsil=record.tehsil,
        district=record.district,
        latitude=record.latitude,
        longitude=record.longitude,
        user_id=current_user["id"],
        source="app"
    )
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return db_record

@router.patch("/{record_id}/reviewed")
async def mark_triage_reviewed(record_id: str, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user["role"] != "tho":
        raise HTTPException(status_code=403, detail="Only THO can review records")

    query = select(TriageRecord).where(TriageRecord.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    record.reviewed = True
    await db.commit()
    return {"success": True}


@router.post("/ai-suggestion")
async def get_ai_suggestion(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Get AI medical suggestions using Hugging Face model.

    Request body:
    {
        "symptoms": ["fever", "leg swelling"],
        "severity": "moderate",
        "patient_gender": "male/female/other",
        "patient_age": 35
    }
    """
    try:
        symptoms = request.get("symptoms", [])
        severity = request.get("severity", "moderate")
        patient_gender = request.get("patient_gender", "unknown")
        patient_age = request.get("patient_age", 0)

        if not symptoms:
            raise HTTPException(status_code=400, detail="Symptoms required")

        # Format symptoms for the prompt
        symptoms_text = ", ".join(symptoms)

        # Create prompt with demographic context
        demographic_context = f"Patient: {patient_age} years old, {patient_gender}"

        prompt = f"""You are a medical assistant for rural healthcare workers in India. Provide 4-5 key medical suggestions based on the following information.

{demographic_context}
Symptoms: {symptoms_text}
Current severity assessment: {severity}

Important:
- Provide practical home care suggestions
- Consider gender-specific symptoms when relevant
- Include red flags/warning signs to watch for
- Be conservative and encourage professional medical care when needed
- Format as bullet points
- Do NOT provide definitive diagnosis
- Add appropriate disclaimers about seeking professional care

Suggestions:"""

        hf_token = os.getenv("HF_TOKEN")
        openai_api_key = os.getenv("OPENAI_KEY")

        if hf_token:
            # Use Hugging Face via OpenAI compatible API with default routing
            hf_model = os.getenv("HF_MODEL", "HuggingFaceH4/zephyr-7b-beta")
            client = OpenAI(
                base_url="https://router.huggingface.co/v1/",
                api_key=hf_token
            )
            response = client.chat.completions.create(
                model=hf_model,
                messages=[
                    {"role": "system", "content": "You are a medical assistant for rural healthcare workers in India. Provide 4-5 key medical suggestions based on the provided information. Provide practical home care suggestions, consider gender-specific symptoms, include red flags, be conservative, and format as bullet points. Do NOT provide definitive diagnosis."},
                    {"role": "user", "content": f"{demographic_context}\nSymptoms: {symptoms_text}\nSeverity: {severity}"}
                ],
                max_tokens=300,
                temperature=0.7
            )
            suggestion = response.choices[0].message.content.strip()
            provider_name = f"Hugging Face ({hf_model})"
        elif openai_api_key:
            # Fallback to OpenAI GPT-4o
            client = OpenAI(api_key=openai_api_key)
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a medical assistant for rural healthcare workers in India. Provide 4-5 key medical suggestions based on the provided information. Provide practical home care suggestions, consider gender-specific symptoms, include red flags, be conservative, and format as bullet points. Do NOT provide definitive diagnosis."},
                    {"role": "user", "content": f"{demographic_context}\nSymptoms: {symptoms_text}\nSeverity: {severity}"}
                ]
            )
            suggestion = response.choices[0].message.content.strip()
            provider_name = "OpenAI (GPT-4o)"
        else:
            raise HTTPException(status_code=500, detail="Neither HF_TOKEN nor OPENAI_KEY is configured")

        return {
            "success": True,
            "suggestion": suggestion,
            "provider": provider_name,
            "symptoms": symptoms,
            "severity": severity,
            "demographic": {
                "age": patient_age,
                "gender": patient_gender
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI suggestion error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Suggestion failed: {str(e)}")


@router.post("/voice-triage")
async def voice_triage(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Flutter-native voice triage endpoint.

    Accepts a multipart audio file (m4a / mp3 / wav / ogg) recorded
    in-app by the ASHA worker. Pipeline:
      1. Whisper-1 transcribes audio (auto language detection)
      2. GPT-4o applies WHO IMNCI + Odisha sickle-cell triage rules
      3. Returns structured JSON for the ASHA to review before saving

    Response:
    {
      "transcript": "...",
      "symptoms": ["fever", "headache"],
      "severity": "yellow",
      "sickle_cell_risk": false,
      "brief": "Patient presents with ..."
    }
    """
    openai_api_key = os.getenv("OPENAI_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured (missing OPENAI_KEY)")

    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file received")

        logger.info(f"Voice triage: received {len(audio_bytes)} bytes from user {current_user['id']}")

        client = OpenAI(api_key=openai_api_key)

        # ── Step 1: Whisper transcription ──────────────────────────────
        filename = audio.filename or "recording.m4a"
        content_type = audio.content_type or "audio/mp4"

        whisper_result = client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_bytes, content_type),
            # language not forced — Whisper auto-detects Hindi/Odia/Marathi
        )
        transcript = whisper_result.text.strip()
        logger.info(f"Whisper transcript: {transcript}")

        if not transcript:
            return {
                "patient_name": "",
                "transcript": "",
                "symptoms": [],
                "severity": "yellow",
                "sickle_cell_risk": False,
                "brief": "Could not transcribe audio. Please try again in a quieter environment."
            }

        # ── Step 2: GPT-4o IMNCI triage ───────────────────────────────
        triage_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": TRIAGE_SYSTEM_PROMPT},
                {"role": "user", "content": transcript}
            ],
            response_format={"type": "json_object"}
        )
        triage_raw = triage_response.choices[0].message.content
        triage_result = json.loads(triage_raw)

        logger.info(f"Triage result: severity={triage_result.get('severity')} "
                    f"sickle_cell={triage_result.get('sickle_cell_risk')}")

        return {
            "patient_name": triage_result.get("patient_name", ""),
            "transcript": transcript,
            "symptoms": triage_result.get("symptoms", []),
            "severity": triage_result.get("severity", "yellow"),
            "sickle_cell_risk": triage_result.get("sickle_cell_risk", False),
            "brief": triage_result.get("brief", "")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice triage error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice triage failed: {str(e)}")
