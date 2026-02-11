from fastapi import FastAPI, HTTPException, Header, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

from agents.synthesis_agent import synthesis_agent
# Temporarily disabled until google-cloud-speech is installed
# from services.audio import audio_streamer
# from agents.scribe import scribe_agent

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
    Executes Gemini 1.5 Flash via Google Cloud Vertex AI.
    """
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage
        
        # Initialize Chat Model
        # When GOOGLE_GENAI_USE_VERTEXAI=True is in env, it uses Vertex AI via Service Account
        model_name = request.model if request.model else "gemini-2.0-flash"
        
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=request.config.get("temperature", 0.7) if request.config else 0.7,
            max_output_tokens=request.config.get("maxOutputTokens", 2048) if request.config else 2048,
            location=os.environ.get("GCP_LOCATION", "us-central1")
        )
        
        # Execute chain
        response = await llm.ainvoke([HumanMessage(content=request.contents)])
        
        return {
            "text": response.content,
            "model": model_name
        }
        
    except Exception as e:
        print(f"Vertex AI Error: {e}")
        raise HTTPException(status_code=500, detail=f"Vertex AI Error: {str(e)}")

# Temporarily disabled - uncomment after installing google-cloud-speech
# @app.websocket("/ws/audio/{session_id}")
# async def websocket_audio_endpoint(websocket: WebSocket, session_id: str):
#     """
#     WebSocket for real-time audio streaming and transcription.
#     Chunks are sent from frontend, processed via Chirp v2, 
#     and then concept-extracted via ScribeAgent.
#     """
#     await websocket.accept()
#     print(f"🎙️ WebSocket connected for session: {session_id}")
#     
#     # Queue for audio chunks
#     audio_queue = asyncio.Queue()
#     
#     async def audio_generator():
#         while True:
#             chunk = await audio_queue.get()
#             if chunk is None:
#                 break
#             yield chunk
#
#     # Start transcription task
#     transcription_task = asyncio.create_task(
#         _process_transcription(websocket, session_id, audio_generator())
#     )
#
#     try:
#         while True:
#             # Receive binary audio data
#             data = await websocket.receive_bytes()
#             await audio_queue.put(data)
#     except WebSocketDisconnect:
#         print(f"🔌 WebSocket disconnected for session: {session_id}")
#     except Exception as e:
#         print(f"❌ WebSocket Error: {e}")
#     finally:
#         await audio_queue.put(None)
#         await transcription_task
#
# async def _process_transcription(websocket: WebSocket, session_id: str, audio_gen):
#     """Auxiliary task to process the transcription stream."""
#     async for result in audio_streamer.transcribe_stream(audio_gen):
#         if "error" in result:
#             await websocket.send_json({"type": "error", "message": result["error"]})
#             continue
#             
#         # Send transcript back to UI
#         await websocket.send_json({
#             "type": "transcript",
#             "text": result["text"],
#             "is_final": result["is_final"]
#         })
#         
#         # If final, trigger ScribeAgent to update the graph
#         if result["is_final"]:
#             try:
#                 # ScribeAgent extracts concepts and updates Cloud SQL
#                 concepts = await scribe_agent.process_transcript(session_id, result["text"])
#                 if concepts:
#                     await websocket.send_json({
#                         "type": "graph_update",
#                         "concepts": concepts
#                     })
#             except Exception as e:
#                 print(f"⚠️ Scribe Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
