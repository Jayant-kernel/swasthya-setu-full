import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    tables = {
        "users": ["avatar_b64", "banner_b64"],
        "patients": ["tehsil", "user_id", "pregnant", "abha_id"],
        "triage_records": ["tehsil", "latitude", "longitude", "user_id"],
        "reviews": ["userName", "designation", "location"]
    }
    
    for table, columns in tables.items():
        print(f"Checking table: {table}")
        for col in columns:
            async with engine.begin() as conn:
                try:
                    col_type = "BOOLEAN" if col == "pregnant" else "FLOAT" if col in ["latitude", "longitude"] else "VARCHAR"
                    await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                    print(f"  + Added {col} to {table}")
                except Exception as e:
                    if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                        print(f"  . {col} already exists in {table}")
                    else:
                        print(f"  ! Error adding {col} to {table}: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
