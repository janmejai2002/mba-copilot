from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

from agents.synthesis_agent import synthesis_agent

app = FastAPI(title="Vidyos Agentic Backend", version="0.1.0")

class GeminiRequest(BaseModel):
    model: str
    contents: str
    config: Optional[dict] = None

class SynthesisRequest(BaseModel):
    subject: str
    transcript: str
    notes: Optional[str] = ""
    chats: Optional[str] = ""

@app.get("/")
async def health_check():
    return {"status": "active", "service": "Vidyos Fusion Engine", "version": "0.1.0"}

@app.post("/api/agent/synthesis")
async def run_synthesis(request: SynthesisRequest):
    """
    Triggers the Synthesis Agent to generate a Master Doc.
    """
    try:
        doc = await synthesis_agent.generate_master_doc(
            request.subject, 
            request.transcript, 
            request.notes, 
            request.chats
        )
        return {"master_doc": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/gemini")
async def gemini_proxy(request: GeminiRequest, x_custom_gemini_key: Optional[str] = Header(None)):
    """
    Bridge endpoint to Vertex AI. 
    Eventually will be replaced by specific agentic endpoints.
    """
    # Placeholder for Vertex AI integration
    # In a real setup, we would use vertexai.init() and GenerativeModel
    return {
        "text": f"GCP Backend Received: {request.contents[:50]}...",
        "model": request.model
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
