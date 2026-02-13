
import asyncio
import os
from dotenv import load_dotenv
from backend.core.db import get_db_connection

load_dotenv()

async def test_db():
    print("🐘 Testing DB Connection...")
    try:
        conn = await get_db_connection()
        print("✅ Connection successful!")
        res = await conn.fetchval("SELECT 1")
        print(f"Result: {res}")
        await conn.close()
    except Exception as e:
        print(f"❌ DB Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_db())
