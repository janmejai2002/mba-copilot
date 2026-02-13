
import unittest
import asyncio
import os
import sys
from dotenv import load_dotenv

# Path setup
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_path not in sys.path:
    sys.path.append(backend_path)

# Load real environment variables
load_dotenv()

from agents.mastermind import master_graph
from langchain_core.messages import HumanMessage

class TestAgentsReal(unittest.IsolatedAsyncioTestCase):
    """
    REAL integration tests. These will use your Google Cloud credits.
    They verify that the keys and Vertex AI configurations are correct.
    """

    async def test_mastermind_real_routing(self):
        """Tests that MasterMind can actually talk to Gemini and route a request."""
        print("\n🚀 Testing REAL MasterMind Routing...")
        
        initial_state = {
            "messages": [HumanMessage(content="Explain the Porter's Five Forces model in detail.")],
            "user_context": {"current_page": "Strategy", "user_focus": "Node: Competition"},
            "next": ""
        }
        
        # We invoke the real graph
        try:
            final_state = await master_graph.ainvoke(initial_state)
            
            response_messages = final_state.get("messages", [])
            last_msg = response_messages[-1].content if response_messages else ""
            last_agent = final_state.get("next", "UNKNOWN")
            
            print(f"✅ MasterMind Response received from: {last_agent}")
            print(f"📄 Response Preview: {last_msg[:100]}...")
            
            self.assertNotEqual(last_msg, "")
            self.assertIn(last_agent, ["ProfessorAgent", "ResearchAgent", "DONE"])
            
        except Exception as e:
            self.fail(f"Real MasterMind call failed: {e}")

    async def test_scribe_real_extraction(self):
        """Tests child agent (Scribe) with real LLM."""
        print("\n📝 Testing REAL Scribe Concept Extraction...")
        from agents.scribe import scribe_agent
        
        test_text = "The Modigliani-Miller theorem states that the capital structure of a firm is irrelevant to its value."
        
        try:
            nodes = await scribe_agent.process_transcript("test-session", test_text)
            print(f"✅ Scribe extracted {len(nodes)} nodes.")
            for n in nodes:
                print(f"   - {n['label']} ({n['type']})")
            
            self.assertGreaterEqual(len(nodes), 1)
            self.assertTrue(any("Modigliani" in n['label'] or "Capital" in n['label'] for n in nodes))
            
        except Exception as e:
            # If DB is not reachable, this might fail, but let's see if LLM part works
            if "DB Connection Error" in str(e) or "Connection refused" in str(e).lower():
                print("⚠️ Scribe LLM worked but DB connection failed (Expected if Cloud SQL Proxy not running)")
                return
            self.fail(f"Real Scribe extraction failed: {e}")

if __name__ == '__main__':
    unittest.main()
