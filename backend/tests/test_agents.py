
import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import asyncio
import os
import sys
import json

# Add backend to path so we can import agents
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_path not in sys.path:
    sys.path.append(backend_path)

# Mock environment variables
os.environ["GCP_PROJECT"] = "test-project"
os.environ["GCP_LOCATION"] = "us-central1"
os.environ["GOOGLE_API_KEY"] = "dummy-api-key"

# Helper to mock before imports
def setup_mocks():
    # Mocking vertexai and GCP clients before they are imported by agents
    # We use patch.dict or just patch with create=True to avoid AttributeError
    patch('vertexai.init').start()
    patch('vertexai.vision_models.ImageGenerationModel.from_pretrained').start()
    
    # Use create=True to handle modules that might not be installed in the environment
    patch('google.cloud.texttospeech.TextToSpeechClient', create=True).start()
    patch('google.cloud.discoveryengine_v1beta.SearchServiceClient', create=True).start()

setup_mocks()

# Now safe to import agents
from agents.mastermind import supervisor_node
from agents.scribe import ScribeAgent
from agents.professor import ProfessorAgent
from agents.researcher import ResearchAgent
from agents.curriculum import CurriculumMaster
from agents.artist import ArtistAgent
from agents.composer import ComposerAgent

class TestVidyosAgentsMocked(unittest.IsolatedAsyncioTestCase):

    async def test_mastermind_routing(self):
        """Tests that MasterMind correctly routes to the Professor agent."""
        with patch('agents.mastermind.chain.invoke') as mock_invoke:
            mock_invoke.return_value = MagicMock(content="Professor")
            state = {
                "messages": [MagicMock(content="Explain the Capital Asset Pricing Model")],
                "user_context": {"current_page": "Finance"}
            }
            result = supervisor_node(state)
            self.assertEqual(result["next"], "ProfessorAgent")

    async def test_professor_agent(self):
        """Tests that the ProfessorAgent returns a theoretical explanation."""
        agent = ProfessorAgent()
        mock_response = MagicMock(content="CAPM is a model that describes the relationship between systematic risk and expected return.")
        
        with patch.object(agent.llm, 'ainvoke', new_callable=AsyncMock) as mock_ainvoke:
            mock_ainvoke.return_value = mock_response
            state = {
                "messages": [MagicMock(content="What is CAPM?")],
                "user_context": {"current_page": "Finance"}
            }
            result = await agent.run(state)
            self.assertEqual(len(result["messages"]), 1)
            self.assertIn("CAPM", result["messages"][0].content)

    async def test_scribe_agent(self):
        """Tests that the ScribeAgent extracts and 'stores' concepts."""
        agent = ScribeAgent()
        mock_extraction = {
            "nodes": [{"label": "CAPM", "type": "Theorem", "content": "Capital Asset Pricing Model"}],
            "edges": []
        }
        
        with patch.object(agent, '_extract_knowledge', new_callable=AsyncMock) as mock_extract:
            mock_extract.return_value = mock_extraction
            with patch.object(agent, '_upsert_node', new_callable=AsyncMock) as mock_upsert:
                mock_upsert.return_value = "uuid-123"
                
                state = {
                    "messages": [MagicMock(content="Today we learn about CAPM.")],
                    "user_context": {"session_id": "session-123"}
                }
                result = await agent.run(state)
                self.assertIn("Extracted 1 new concepts", result["messages"][0])
                self.assertEqual(result["payload"]["nodes"][0]["id"], "uuid-123")

    async def test_research_agent(self):
        """Tests that the ResearchAgent performs search and synthesis."""
        agent = ResearchAgent()
        mock_llm_response = MagicMock(content="According to recent data, the market is volatile.")
        
        with patch.object(agent.llm, 'ainvoke', new_callable=AsyncMock) as mock_ainvoke:
            mock_ainvoke.return_value = mock_llm_response
            with patch.object(agent, 'search_google', new_callable=AsyncMock) as mock_search:
                mock_search.return_value = "Stock market trends 2026..."
                
                state = {
                    "messages": [MagicMock(content="What are the current market trends?")],
                    "user_context": {}
                }
                result = await agent.run(state)
                self.assertEqual(len(result["messages"]), 1)
                self.assertIn("market is volatile", result["messages"][0].content)

    async def test_curriculum_master(self):
        """Tests that the CurriculumMaster adjusts content level."""
        agent = CurriculumMaster()
        mock_response = MagicMock(content="Since you are a beginner, think of CAPM as a way to measure risk.")
        
        with patch.object(agent.llm, 'ainvoke', new_callable=AsyncMock) as mock_ainvoke:
            mock_ainvoke.return_value = mock_response
            with patch.object(agent, '_get_user_mastery', new_callable=AsyncMock) as mock_mastery:
                mock_mastery.return_value = [{"label": "Finance", "mastery_level": "Beginner"}]
                
                state = {
                    "messages": [MagicMock(content="Explain CAPM")],
                    "user_context": {"user_id": "test-user-id"}
                }
                result = await agent.run(state)
                self.assertIn("beginner", result["messages"][0].content.lower())

    async def test_artist_agent(self):
        """Tests that the ArtistAgent returns an image payload."""
        agent = ArtistAgent()
        
        state = {
            "messages": [MagicMock(content="Draw a supply and demand curve")],
            "user_context": {}
        }
        result = await agent.run(state)
        response_data = json.loads(result["messages"][0])
        self.assertEqual(response_data["type"], "image")
        self.assertIn("generating a visual diagram", response_data["text"])

    async def test_composer_agent(self):
        """Tests that the ComposerAgent returns an audio composition message."""
        agent = ComposerAgent()
        state = {
            "messages": [MagicMock(content="Summarize the lecture in a 2-minute audio")],
            "user_context": {}
        }
        result = await agent.run(state)
        self.assertIn("composing a voice summary", result["messages"][0])

if __name__ == '__main__':
    unittest.main()
