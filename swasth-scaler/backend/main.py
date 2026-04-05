import os
import json
import logging
import httpx
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from openai import OpenAI
from dotenv import load_dotenv

from database import engine, Base, AsyncSessionLocal
from models import TriageRecord
from routes import auth_routes, patient_routes, triage_routes, user_routes

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register new routers
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(patient_routes.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(triage_routes.router, prefix="/api/v1/triage_records", tags=["Triage Records"])

from sqlalchemy.future import select
from models import User
from auth import get_password_hash

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        if not result.scalar_one_or_none():
            logger.info("Database empty! Seeding default user accounts...")
            session.add_all([
                User(employee_id="ASHA001", role="asha", password_hash=get_password_hash("password"), full_name="Kalyani Dash", location="Village Alpha", district="Puri"),
                User(employee_id="DMO001", role="dmo", password_hash=get_password_hash("password"), full_name="Dr. Pradhan", location="District HQ", district="Puri"),
                User(employee_id="ADMIN001", role="admin", password_hash=get_password_hash("password"), full_name="System Admin", location="State HQ", district="All")
            ])
            await session.commit()
            logger.info("Seed complete.")

# Initialize clients with error handling
try:
    openai_client = OpenAI(api_key=os.getenv("OPENAI_KEY"))
    logger.info("OpenAI client initialized")
except Exception as e:
    logger.error(f"OpenAI init failed: {e}")
    openai_client = None

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
{"symptoms": [], "severity": "green|yellow|red",
 "sickle_cell_risk": false, "brief": ""}
"""


@app.get("/health")
async def health():
    return {"status": "ok", "service": "swasthya-setu-backend"}


@app.post("/incoming-call")
async def incoming_call(request: Request):
    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">
        Namaste. Swasthya Setu mein aapka swagat hai.
        Beep ke baad apne lakshan batayein.
        Aapki recording save ho jayegi.
    </Say>
    <Record
        maxLength="60"
        action="/webhook/call"
        recordingStatusCallback="/webhook/call"
        transcribe="false"
        playBeep="true"
    />
</Response>"""
    return PlainTextResponse(content=twiml, media_type="application/xml")


@app.post("/webhook/call")
async def webhook_call(request: Request):
    try:
        form_data = await request.form()
        caller_phone = form_data.get("From", "unknown")
        call_sid = form_data.get("CallSid", "")
        recording_url = form_data.get("RecordingUrl", "")

        logger.info(f"Call received from {caller_phone}")
        logger.info(f"Recording URL: {recording_url}")

        # Download audio from Twilio
        audio_bytes = None
        if recording_url:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        recording_url + ".mp3",
                        auth=(
                            os.getenv("TWILIO_ACCOUNT_SID"),
                            os.getenv("TWILIO_AUTH_TOKEN")
                        ),
                        timeout=30.0
                    )
                    audio_bytes = response.content
                    logger.info(f"Audio downloaded: {len(audio_bytes)} bytes")
            except Exception as e:
                logger.error(f"Audio download failed: {e}")

        # Transcribe with Whisper
        original_transcript = ""
        if audio_bytes and openai_client:
            try:
                result = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("recording.mp3", audio_bytes, "audio/mpeg"),
                    language="or"
                )
                original_transcript = result.text
                logger.info(f"Transcript: {original_transcript}")
            except Exception as e:
                logger.error(f"Whisper failed: {e}")
                original_transcript = "Transcription failed"

        # Translate to 3 languages
        translations = {
            "english": original_transcript,
            "hindi": original_transcript,
            "odia": original_transcript
        }
        if original_transcript and openai_client:
            try:
                translation_response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{
                        "role": "user",
                        "content": f"""Translate this text to English, Hindi, and Odia.
Return ONLY valid JSON no markdown:
{{"english": "translation", "hindi": "translation", "odia": "translation"}}
Text: {original_transcript}"""
                    }],
                    response_format={"type": "json_object"}
                )
                translations = json.loads(
                    translation_response.choices[0].message.content
                )
                logger.info("Translations done")
            except Exception as e:
                logger.error(f"Translation failed: {e}")

        # Run IMNCI triage
        triage_result = {
            "symptoms": [],
            "severity": "yellow",
            "sickle_cell_risk": False,
            "brief": "Unable to process triage"
        }
        if translations.get("english") and openai_client:
            try:
                triage_response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": TRIAGE_SYSTEM_PROMPT},
                        {"role": "user", "content": translations["english"]}
                    ],
                    response_format={"type": "json_object"}
                )
                triage_result = json.loads(
                    triage_response.choices[0].message.content
                )
                logger.info(f"Triage: {triage_result}")
            except Exception as e:
                logger.error(f"Triage failed: {e}")

        # Save to DB
        try:
            async with AsyncSessionLocal() as db:
                db_record = TriageRecord(
                    patient_name=f"Caller {caller_phone[-4:]}",
                    caller_phone=caller_phone,
                    call_sid=call_sid,
                    source="helpline_call",
                    recording_url=recording_url + ".mp3" if recording_url else "",
                    transcript=original_transcript,
                    transcript_english=translations.get("english", ""),
                    transcript_hindi=translations.get("hindi", ""),
                    transcript_odia=translations.get("odia", ""),
                    symptoms=triage_result.get("symptoms", []),
                    severity=triage_result.get("severity", "yellow"),
                    sickle_cell_risk=triage_result.get("sickle_cell_risk", False),
                    brief=triage_result.get("brief", ""),
                    reviewed=False
                )
                db.add(db_record)
                await db.commit()
                logger.info("Saved to Database")
        except Exception as e:
            logger.error(f"Database save failed: {e}")

        # Return TwiML voice response
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">
        Aapka sandesh record ho gaya hai.
        Swasthya Setu team aapse jald sampark karegi.
        Dhanyavaad.
    </Say>
</Response>"""
        return PlainTextResponse(content=twiml, media_type="application/xml")

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">
        Kripya baad mein call karein.
    </Say>
</Response>"""
        return PlainTextResponse(content=twiml, media_type="application/xml")



