
import os
import vertexai
from vertexai.vision_models import ImageGenerationModel
import json
from core.state import AgentState

class ArtistAgent:
    """
    The Artist.
    Generates visual diagrams and thumbnails for graph nodes using Imagen 3.
    """
    def __init__(self):
        self.project_id = os.getenv("GCP_PROJECT", "mba-copilot-485805")
        self.location = os.getenv("GCP_LOCATION", "us-central1")
        vertexai.init(project=self.project_id, location=self.location)
        self.model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001") # Stable Imagen 3

    async def run(self, state: AgentState):
        """
        Generates an image based on the current context or node label.
        """
        messages = state["messages"]
        last_message = messages[-1].content
        
        # In a real app, we'd save this to GCS and return a URL.
        # For now, we simulate the 'Artist working' response.
        
        prompt = f"Creating a professional educational diagram for: {last_message}"
        # response = self.model.generate_images(prompt=prompt)
        
        return {
            "messages": [
                json.dumps({
                    "type": "image",
                    "text": f"I am generating a visual diagram for '{last_message}' using Imagen 3.",
                    "payload": {
                        "url": None # In production, this would be the GCS URL
                    }
                })
            ]
        }

# Export for LangGraph
artist_agent = ArtistAgent()

async def artist_node(state: AgentState):
    return await artist_agent.run(state)
