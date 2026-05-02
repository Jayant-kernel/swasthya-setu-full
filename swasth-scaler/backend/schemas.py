from pydantic import BaseModel, validator
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

class UserOut(BaseModel):
    id: str
    employee_id: str
    full_name: Optional[str] = None
    role: str
    location: Optional[str] = None
    district: Optional[str] = None
    email: Optional[str] = None
    avatar_b64: Optional[str] = None
    banner_b64: Optional[str] = None

class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    village: Optional[str] = None
    tehsil: Optional[str] = None
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
    tehsil: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ReviewCreate(BaseModel):
    role: str
    overall: int
    categories: Optional[dict] = None
    comment: Optional[str] = None
    userName: Optional[str] = None
    designation: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None


class PatientProgressCreate(BaseModel):
    patient_id: str
    status: str
    symptoms: List[str]
    notes: Optional[str] = None
    referred: Optional[bool] = False

    @validator("status")
    def validate_status(cls, value: str) -> str:
        allowed = {"improving", "stable", "worsening"}
        if value not in allowed:
            raise ValueError("status must be one of improving|stable|worsening")
        return value


class PatientProgressOut(BaseModel):
    id: str
    patient_id: str
    status: str
    symptoms: List[str]
    notes: Optional[str] = None
    referred: bool
    created_at: datetime

    class Config:
        orm_mode = True
