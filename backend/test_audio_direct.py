
import asyncio
import os
from services.audio import audio_streamer

async def test_direct_transcription():
    print("🎙️ Testing Direct Chirp v2 Transcription...")
    
    if not os.path.exists("../test_audio.wav"):
        print("❌ test_audio.wav not found!")
        return

    async def audio_gen():
        with open("../test_audio.wav", "rb") as f:
            while True:
                chunk = f.read(4000) # Small chunks
                if not chunk:
                    break
                yield chunk
                await asyncio.sleep(0.1) # Simulate real-time

    print("🚀 Starting stream...")
    async for result in audio_streamer.transcribe_stream(audio_gen()):
        print(f"Result: {result}")

if __name__ == "__main__":
    # Ensure we are in the backend dir
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    asyncio.run(test_direct_transcription())
