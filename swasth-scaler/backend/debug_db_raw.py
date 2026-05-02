import asyncio
from sqlalchemy import text
from database import AsyncSessionLocal

async def check_data():
    async with AsyncSessionLocal() as session:
        # Check users district
        print("--- Users ---")
        user_res = await session.execute(text("SELECT employee_id, role, district FROM users"))
        for row in user_res:
            print(f"User: {row[0]}, Role: {row[1]}, District: '{row[2]}'")

        # Check patients district
        print("\n--- Patients ---")
        patient_res = await session.execute(text("SELECT name, district FROM patients"))
        for row in patient_res:
            print(f"Patient: {row[0]}, District: '{row[1]}'")

        # Check records district
        print("\n--- Triage Records ---")
        record_res = await session.execute(text("SELECT patient_name, district FROM triage_records"))
        for row in record_res:
            print(f"Record: {row[0]}, District: '{row[1]}'")

if __name__ == "__main__":
    asyncio.run(check_data())
