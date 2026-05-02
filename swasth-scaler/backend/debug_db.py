import asyncio
from sqlalchemy.future import select
from database import AsyncSessionLocal
from models import User, Patient, TriageRecord

async def check_data():
    async with AsyncSessionLocal() as session:
        # Check users
        user_res = await session.execute(select(User))
        users = user_res.scalars().all()
        print(f"Users found: {len(users)}")
        for u in users:
            print(f" - {u.employee_id}: role={u.role}, district='{u.district}'")

        # Check patients
        patient_res = await session.execute(select(Patient))
        patients = patient_res.scalars().all()
        print(f"\nPatients found: {len(patients)}")
        for p in patients:
            print(f" - {p.name}: district='{p.district}'")

        # Check records
        record_res = await session.execute(select(TriageRecord))
        records = record_res.scalars().all()
        print(f"\nTriage Records found: {len(records)}")
        for r in records:
            print(f" - {r.patient_name}: district='{r.district}'")

if __name__ == "__main__":
    asyncio.run(check_data())
