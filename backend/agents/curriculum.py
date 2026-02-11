
import os
import json
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from core.state import AgentState
from core.db import get_db_connection

class CurriculumMaster:
    """
    The Teacher.
    Adjusts the learning path and content depth based on user mastery levels.
    """
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.3,
            location=os.environ.get("GCP_LOCATION", "us-central1")
        )

    async def run(self, state: AgentState):
        """
        Adjusts state or provides guidance based on mastery.
        """
        messages = state["messages"]
        last_message = messages[-1].content
        user_id = state.get("user_context", {}).get("user_id", "00000000-0000-0000-0000-000000000000") # Dummy UUID

        # 1. Fetch relevant mastery levels from DB
        mastery_data = await self._get_user_mastery(user_id)
        
        # 2. Decide on content level and pruning
        system_instruction = (
            "You are a Curriculum Expert. Based on the user's current mastery levels, "
            "decide how to present the requested information. "
            "If they are a Beginner, use analogies and simple language. "
            "If they are Advanced, dive into technical details and formulas.\n\n"
            f"User Mastery Context: {json.dumps(mastery_data)}\n\n"
            "Respond with a tailored explanation or guidance."
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("human", "{input}")
        ])
        
        chain = prompt | self.llm
        response = await chain.ainvoke({"input": last_message})
        
        return {"messages": [response]}

    async def _get_user_mastery(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetches mastery data for the user from Cloud SQL.
        """
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                "SELECT n.label, m.mastery_level, m.score "
                "FROM user_mastery m "
                "JOIN knowledge_nodes n ON m.node_id = n.id "
                "WHERE m.user_id = $1",
                user_id
            )
            return [dict(r) for r in rows]
        except Exception as e:
            print(f"❌ Error fetching mastery: {e}")
            return []
        finally:
            await conn.close()

# Export for LangGraph
curriculum_agent = CurriculumMaster()

async def curriculum_node(state: AgentState):
    return await curriculum_agent.run(state)
