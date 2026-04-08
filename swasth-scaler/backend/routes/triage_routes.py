from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import TriageRecord
from schemas import TriageCreate
from auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_triage_records(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(TriageRecord).order_by(TriageRecord.created_at.desc())
    if current_user["role"] == "asha":
        query = query.where(TriageRecord.user_id == current_user["id"])
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
    if current_user["role"] != "dmo":
        raise HTTPException(status_code=403, detail="Only DMO can review records")
        
    query = select(TriageRecord).where(TriageRecord.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    record.reviewed = True
    await db.commit()
    return {"success": True}
