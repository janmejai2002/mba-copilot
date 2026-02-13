from fastapi import FastAPI, HTTPException, Header, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import asyncio
from dotenv import load_dotenv
import tempfile
import base64

load_dotenv()

# ─── LAZY LOADING ───
# Do NOT import agents at module level — their dependencies (Vertex AI, LangChain)
# require GCP authentication which may not be available at container cold-start.
# Instead, we import them on first use inside each endpoint.

_master_graph = None
_synthesis_agent = None

def get_master_graph():
    global _master_graph
    if _master_graph is None:
        from agents.mastermind import master_graph
        _master_graph = master_graph
    return _master_graph

def get_synthesis_agent():
    global _synthesis_agent
    if _synthesis_agent is None:
        from agents.synthesis_agent import synthesis_agent
        _synthesis_agent = synthesis_agent
    return _synthesis_agent

app = FastAPI(title="Vidyos Agentic Backend", version="0.1.0")

# CORS for dev and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GeminiRequest(BaseModel):
    model: str
    contents: str
    config: Optional[dict] = None

class SynthesisRequest(BaseModel):
    subject: str
    transcript: str
    notes: Optional[str] = ""
    chats: Optional[str] = ""

class ChatRequest(BaseModel):
    message: str
    session_id: str
    user_context: Optional[dict] = {}

@app.get("/")
async def health_check():
    return {"status": "active", "service": "Vidyos Fusion Engine", "version": "0.1.0"}

@app.post("/api/agent/chat")
async def run_chat(request: ChatRequest):
    """
    Triggers the MasterMind LangGraph for a multi-turn agentic conversation.
    """
    try:
        from langchain_core.messages import HumanMessage
        graph = get_master_graph()
        
        # Initial state for the graph
        initial_state = {
            "messages": [HumanMessage(content=request.message)],
            "user_context": request.user_context,
            "next": ""
        }
        
        # Run the graph
        final_state = await graph.ainvoke(initial_state)
        
        # Extract the last message from the graph
        response_messages = final_state.get("messages", [])
        ai_response = response_messages[-1].content if response_messages else "No response generated."
        
        # Determine the agent that was last active
        last_agent = final_state.get("next", "MasterMind")
        if last_agent == "DONE":
            # Find the true last agent by looking at message metadata or logic
            # For now, we'll try to parse the content
            pass

        # Try to parse as JSON if structured output is expected
        try:
            structured_data = json.loads(ai_response)
            return {
                "response": structured_data.get("text", ai_response),
                "type": structured_data.get("type", "text"),
                "payload": structured_data.get("payload", {}),
                "agent": last_agent,
                "intermediate_steps": [m.content for m in response_messages[1:-1]]
            }
        except:
            return {
                "response": ai_response,
                "agent": last_agent,
                "intermediate_steps": [m.content for m in response_messages[1:-1]]
            }
    except Exception as e:
        print(f"Graph Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/synthesis")
async def run_synthesis(request: SynthesisRequest):
    """
    Triggers the Synthesis Agent to generate a Master Doc.
    """
    try:
        agent = get_synthesis_agent()
        doc = await agent.generate_master_doc(
            request.subject, 
            request.transcript, 
            request.notes, 
            request.chats
        )
        return {"master_doc": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en-IN"),
    model: str = Form("chirp_2")
):
    """
    Transcribes audio using Google Cloud Speech-to-Text V2 (Chirp model).
    Accepts audio file uploads from the frontend.
    Supports multilingual transcription (Hindi-English code-switching).
    """
    try:
        from google.cloud import speech_v2 as speech
        
        project_id = os.environ.get("GCP_PROJECT", "mba-copilot-485805")
        location = "global"  # Chirp requires global, not regional
        
        client = speech.SpeechClient()
        
        # Read the uploaded audio file
        audio_content = await audio.read()
        
        # Configure the recognition request
        config = speech.RecognitionConfig(
            auto_decoding_config=speech.AutoDetectDecodingConfig(),
            language_codes=[language, "hi-IN"],  # Primary + Hindi for code-switching
            model=model,
            features=speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True,
            ),
        )
        
        recognizer_name = f"projects/{project_id}/locations/{location}/recognizers/_"
        
        request = speech.RecognizeRequest(
            recognizer=recognizer_name,
            config=config,
            content=audio_content,
        )

        response = client.recognize(request=request)
        
        transcript_parts = []
        for result in response.results:
            if result.alternatives:
                transcript_parts.append(result.alternatives[0].transcript)
        
        full_transcript = " ".join(transcript_parts)
        
        return {
            "transcript": full_transcript,
            "language": language,
            "model": model,
            "confidence": response.results[0].alternatives[0].confidence if response.results else 0
        }
        
    except ImportError:
        raise HTTPException(
            status_code=500, 
            detail="google-cloud-speech not installed. Run: pip install google-cloud-speech"
        )
    except Exception as e:
        print(f"Google STT Error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription Error: {str(e)}")

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
