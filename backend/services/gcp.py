import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part, FinishReason
import vertexai.preview.generative_models as preview_generative_models
from dotenv import load_dotenv

load_dotenv()

GCP_PROJECT = os.getenv("GCP_PROJECT")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

# When running on Cloud Run, GCP will automatically provide credentials to the service account.
# We only need the project ID.
if GCP_PROJECT:
    print(f"✨ Initializing Vertex AI for project: {GCP_PROJECT}")
    vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)
else:
    print("⚠️ GCP_PROJECT not found. Vertex AI may not initialize correctly.")

class VertexService:
    def __init__(self, model_name: str = "gemini-1.5-pro-002"):
        self.model = GenerativeModel(model_name)

    async def generate_content(self, prompt: str, system_instruction: str = None):
        if system_instruction:
            model = GenerativeModel(
                self.model.model_name,
                system_instruction=[system_instruction]
            )
        else:
            model = self.model
            
        response = await model.generate_content_async(prompt)
        return response.text

vertex_service = VertexService()
