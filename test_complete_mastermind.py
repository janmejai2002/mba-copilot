
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(dotenv_path="backend/.env")

print("🧪 Testing Complete MasterMind Graph...")

try:
    # 1. Import MasterMind (which imports sub-agents)
    from agents.mastermind import master_graph
    print("✅ MasterMind Graph compiled successfully.")
    
    # 2. Simulate User Interaction
    from langchain_core.messages import HumanMessage
    
    print("🔍 Simulating user input: 'Explain Variance Analysis'")
    initial_state = {
        "messages": [HumanMessage(content="Explain Variance Analysis")],
        "user_context": {"current_page": "Finance Basics", "user_focus": "Variance Formula"},
        "graph_context": {},
        "next": ""
    }
    
    # Run invoke (synchronous wrapper around ainvoke for testing, or just use ainvoke if asyncio)
    # Since LangGraph is async-native, better to run in asyncio loop
    import asyncio
    
    async def run_test():
        try:
            result = await master_graph.ainvoke(initial_state)
            print("✅ Graph Execution Successful!")
            print(f"🤖 Trace: {result['messages'][-1].content}")
        except Exception as e:
            print(f"❌ Execution Failed: {e}")
            import traceback
            traceback.print_exc()

    asyncio.run(run_test())

except ImportError as e:
    print(f"❌ Import Failed: {e}")
    print("Dependencies might still be installing...")
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    import traceback
    traceback.print_exc()
