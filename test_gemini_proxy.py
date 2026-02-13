
import os
import sys
from dotenv import load_dotenv
from fastapi import HTTPException

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(dotenv_path="backend/.env")

from pydantic import BaseModel
from typing import Optional

class GeminiRequest(BaseModel):
    model: str
    contents: str
    config: Optional[dict] = None

print("🧪 Testing Gemini Proxy Endpoint Logic...")

async def test_gemini_proxy():
    try:
        from backend.main import gemini_proxy
        
        req = GeminiRequest(
            model="gemini-2.0-flash",
            contents="Hello, are you working?",
            config={"temperature": 0.5}
        )
        
        print("🚀 Sending request to Vertex AI via gemini_proxy...")
        response = await gemini_proxy(req)
        
        print("✅ Response Received!")
        print(f"Model: {response['model']}")
        print(f"Text: {response['text']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_gemini_proxy())
