from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from auth import get_current_user
from database import get_db
from models import PatientProgress
from schemas import PatientProgressCreate, PatientProgressOut


router = APIRouter()


@router.post("/", response_model=PatientProgressOut)
async def create_progress_update(
    payload: PatientProgressCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ = current_user
    progress = PatientProgress(
        patient_id=payload.patient_id,
        status=payload.status,
        symptoms=payload.symptoms,
        notes=payload.notes,
        referred=payload.referred,
    )
    db.add(progress)
    await db.commit()
    await db.refresh(progress)
    return progress


@router.get("/", response_model=List[PatientProgressOut])
async def list_progress_updates(
    patient_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ = current_user
    query = select(PatientProgress)
    if patient_id:
        query = query.where(PatientProgress.patient_id == patient_id)
    query = query.order_by(PatientProgress.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()
