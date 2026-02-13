
import asyncio
import os
from langchain_core.messages import HumanMessage
from backend.agents.mastermind import master_graph

async def test_full_orchestration():
    print("🧠 Testing Holistic MasterMind Orchestration (Phase 3 Edition)...")
    
    # 1. Test Research Routing
    print("\n[Test 1] Research Routing:")
    state = {
        "messages": [HumanMessage(content="Explain the Black-Scholes model for options pricing.")],
        "user_context": {"current_page": "Finance", "user_focus": "Derivatives"},
        "graph_context": {},
        "next": ""
    }
    result = await master_graph.ainvoke(state)
    print(f"MasterMind Decision: {result['next']}")
    print(f"Response: {result['messages'][-1].content[:200]}...")

    # 2. Test Professor Routing
    print("\n[Test 2] Professor Routing:")
    state = {
        "messages": [HumanMessage(content="What are the key exam topics for Corporate Finance this semester?")],
        "user_context": {"current_page": "Finance"},
        "graph_context": {},
        "next": ""
    }
    result = await master_graph.ainvoke(state)
    print(f"MasterMind Decision: {result['next']}")
    print(f"Response: {result['messages'][-1].content[:200]}...")

    # 3. Test Curriculum Routing
    print("\n[Test 3] Curriculum Routing:")
    state = {
        "messages": [HumanMessage(content="This Finance topic is too hard. Can you simplify it for me?")],
        "user_context": {"current_page": "Finance", "user_id": "00000000-0000-0000-0000-000000000000"},
        "graph_context": {},
        "next": ""
    }
    result = await master_graph.ainvoke(state)
    print(f"MasterMind Decision: {result['next']}")
    print(f"Response: {result['messages'][-1].content[:200]}...")

if __name__ == "__main__":
    asyncio.run(test_full_orchestration())
