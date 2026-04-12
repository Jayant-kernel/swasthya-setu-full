import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, JSON, ForeignKey, Float
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False) # 'asha', 'dmo', 'admin'
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    location = Column(String)
    district = Column(String)
    avatar_b64 = Column(String)
    banner_b64 = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    village = Column(String)
    district = Column(String)
    pregnant = Column(Boolean, default=False)
    abha_id = Column(String)
    user_id = Column(String, ForeignKey("users.id")) # ASHA worker who logged the patient
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class TriageRecord(Base):
    __tablename__ = "triage_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"))
    patient_name = Column(String) # Denormalized for quick access
    caller_phone = Column(String)
    call_sid = Column(String)
    source = Column(String) # 'app', 'helpline_call'
    transcript = Column(String)
    symptoms = Column(JSON, default=list)
    severity = Column(String, default="yellow")
    sickle_cell_risk = Column(Boolean, default=False)
    brief = Column(String)
    reviewed = Column(Boolean, default=False)
    district = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    user_id = Column(String, ForeignKey("users.id")) # ASHA worker who submitted
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
