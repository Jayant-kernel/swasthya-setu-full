import asyncio
from sqlalchemy import text
from database import AsyncSessionLocal, engine, Base
from models import User, Patient, TriageRecord
from datetime import datetime, timedelta

async def seed_sangli():
    # Dummy hash for 'password' (bcrypt $2b$12$...)
    dummy_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s5884Oc7mEaK6"
    
    async with AsyncSessionLocal() as session:
        # 1. Create THO011
        tho = User(
            employee_id="THO011",
            role="tho",
            password_hash=dummy_hash,
            full_name="Dr. Chavan",
            location="Sangli District HQ",
            district="Sangli"
        )
        
        # 2. Create ASHA worker for Sangli
        asha = User(
            employee_id="ASHA-SNG-01",
            role="asha",
            password_hash=dummy_hash,
            full_name="Sunita Patil",
            location="Miraj",
            district="Sangli"
        )
        
        session.add(tho)
        session.add(asha)
        await session.flush() # Get IDs
        
        # 3. Create Patients for Sangli
        p1 = Patient(
            name="Ramesh Patil",
            age=45,
            gender="Male",
            village="Miraj",
            tehsil="Miraj",
            district="Sangli",
            user_id=asha.id
        )
        p2 = Patient(
            name="Sita Deshmukh",
            age=32,
            gender="Female",
            village="Miraj",
            tehsil="Miraj",
            district="Sangli",
            user_id=asha.id
        )
        
        session.add(p1)
        session.add(p2)
        await session.flush()
        
        # 4. Create Triage Records
        t1 = TriageRecord(
            patient_id=p1.id,
            patient_name=p1.name,
            severity="red",
            tehsil="Miraj",
            district="Sangli",
            user_id=asha.id,
            brief="Emergency breathing issues",
            created_at=datetime.now() - timedelta(days=2)
        )
        t2 = TriageRecord(
            patient_id=p2.id,
            patient_name=p2.name,
            severity="yellow",
            tehsil="Miraj",
            district="Sangli",
            user_id=asha.id,
            brief="Fever and cough",
            created_at=datetime.now() - timedelta(days=1)
        )
        
        session.add(t1)
        session.add(t2)
        
        await session.commit()
        print("Successfully seeded Sangli data for THO011!")

if __name__ == "__main__":
    asyncio.run(seed_sangli())
