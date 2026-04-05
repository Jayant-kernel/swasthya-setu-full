from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserLogin(BaseModel):
    employee_id: str
    password: str
    role: str

class UserCreate(BaseModel):
    employee_id: str
    password: str
    role: str
    full_name: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None

class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    avatar_b64: Optional[str] = None
    banner_b64: Optional[str] = None

class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    pregnant: Optional[bool] = False
    abha_id: Optional[str] = None

class TriageCreate(BaseModel):
    patient_id: Optional[str] = None
    patient_name: str
    symptoms: List[str]
    severity: str
    sickle_cell_risk: bool
    brief: str
    district: Optional[str] = None
