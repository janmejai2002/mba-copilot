
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from core.state import AgentState

class ProfessorAgent:
    """
    The Expert.
    Specializes in high-level domain knowledge (Finance, Marketing, Strategy).
    Provides exam predictions and deep theoretical explanations.
    """
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro", # Use Pro for deeper reasoning
            temperature=0.2,
            location=os.environ.get("GCP_LOCATION", "us-central1")
        )

    async def run(self, state: AgentState):
        """
        Provides expert-level subject analysis.
        """
        messages = state["messages"]
        last_message = messages[-1].content
        user_context = state.get("user_context", {})
        current_subject = user_context.get("current_page", "General Management")

        system_instruction = (
            f"You are the Professor of {current_subject}. "
            "Your goal is to provide deep academic insight and identify exam-critical concepts. "
            "Use a professional, authoritative, yet encouraging tone.\n\n"
            "If the user asks a question, explain the underlying theory and its practical application in business."
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("human", "{input}")
        ])
        
        chain = prompt | self.llm
        response = await chain.ainvoke({"input": last_message})
        
        return {"messages": [response]}

# Export for LangGraph
professor_agent = ProfessorAgent()

async def professor_node(state: AgentState):
    return await professor_agent.run(state)
