from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import DiseaseOutbreak
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

router = APIRouter()

class OutbreakResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: Optional[int] = None
    week: Optional[int] = None
    state: Optional[str] = None
    district: Optional[str] = None
    disease: Optional[str] = None
    cases: Optional[int] = None
    deaths: Optional[int] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@router.get("/", response_model=List[OutbreakResponse])
async def get_outbreaks(district: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(DiseaseOutbreak)
    if district:
        query = query.where(DiseaseOutbreak.district == district)
    
    result = await db.execute(query)
    outbreaks = result.scalars().all()
    return [OutbreakResponse.model_validate(o) for o in outbreaks]