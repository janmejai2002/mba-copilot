
import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from dotenv import load_dotenv

load_dotenv()

def test_multimodal_transcription():
    print("🎙️ Testing Multimodal Transcription with Gemini 2.0 Flash...")
    
    project_id = os.getenv("GCP_PROJECT")
    location = os.getenv("GCP_LOCATION", "us-central1")
    
    vertexai.init(project=project_id, location=location)
    
    # Use Gemini 2.0 Flash
    model = GenerativeModel("gemini-2.0-flash")
    
    audio_file_path = "test_audio.wav"
    if not os.path.exists(audio_file_path):
        print(f"❌ {audio_file_path} not found!")
        return

    print(f"🚀 Sending {audio_file_path} to Gemini...")
    
    with open(audio_file_path, "rb") as f:
        audio_data = f.read()

    audio_part = Part.from_data(data=audio_data, mime_type="audio/wav")
    
    prompt = "Transcribe this audio. If it is just a tone, say 'Simple tone detected'."
    
    response = model.generate_content([audio_part, prompt])
    
    print("\n✅ Response from Gemini:")
    print(response.text)

if __name__ == "__main__":
    test_multimodal_transcription()
