
import os
import sys
import asyncio
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(dotenv_path="backend/.env")

from agents.mastermind import master_graph
from langchain_core.messages import HumanMessage

async def test_fm_coherence():
    print("💎 Testing Financial Management Brain Coherence...")
    
    test_cases = [
        "Explain the Weighted Average Cost of Capital (WACC) and why it's used as a hurdle rate.",
        "How do mutually exclusive projects differ from independent projects in Capital Budgeting?",
        "Show me a visual diagram of the different components of the Dividend Discount Model (DDM)."
    ]
    
    for query in test_cases:
        print(f"\n🚀 QUERY: {query}")
        initial_state = {
            "messages": [HumanMessage(content=query)],
            "user_context": {"current_page": "SessionView", "user_focus": "Corporate Finance"},
            "next": ""
        }
        try:
            result = await master_graph.ainvoke(initial_state)
            print(f"✅ AGENT: {result.get('next', 'MasterMind')}")
            print(f"🤖 RESPONSE: {result['messages'][-1].content}")
        except Exception as e:
            print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_fm_coherence())
