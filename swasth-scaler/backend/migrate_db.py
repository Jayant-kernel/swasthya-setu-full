import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating users table...")
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN avatar_b64 VARCHAR"))
            print("Added avatar_b64")
        except Exception as e:
            print(f"avatar_b64 error: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN banner_b64 VARCHAR"))
            print("Added banner_b64")
        except Exception as e:
            print(f"banner_b64 error: {e}")
            
        print("Migrating patients table...")
        try:
            await conn.execute(text("ALTER TABLE patients ADD COLUMN tehsil VARCHAR"))
            print("Added tehsil to patients")
        except Exception as e:
            print(f"patients tehsil error: {e}")
            
        print("Migrating triage_records table...")
        try:
            await conn.execute(text("ALTER TABLE triage_records ADD COLUMN tehsil VARCHAR"))
            print("Added tehsil to triage_records")
        except Exception as e:
            print(f"triage tehsil error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
