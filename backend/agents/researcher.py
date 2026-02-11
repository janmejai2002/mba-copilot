from typing import TypedDict, Annotated, List
from langchain_core.messages import BaseMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from google.cloud import discoveryengine_v1beta as discoveryengine
from core.state import AgentState
import os

# Initialize Gemini with Grounding (Vertex AI)
class ResearchAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro",
            temperature=0.2,
            location=os.environ.get("GCP_LOCATION", "us-central1")
        )
        self.project_id = "mba-copilot-485805"
        self.location = "global" # Discovery Engine usually global
        self.search_client = discoveryengine.SearchServiceClient()

    async def search_google(self, query: str) -> str:
        """
        Performs a search using Vertex AI Search (Generic/Public if configured)
        or simulates a Google Search via a tool.
        For MVP, we return a placeholder or use a search tool if available.
        """
        # Placeholder for actual Vertex AI Search call
        # prompt = f"Search Google for: {query}"
        return f"Results for {query} (Simulated)"

    async def run(self, state: AgentState):
        """
        The main entry point for the Research Agent.
        """
        messages = state["messages"]
        last_message = messages[-1].content
        
        # 1. Generate search queries
        query_prompt = f"Given the user request: '{last_message}', generate 3 specific search queries to find the most accurate and up-to-date information."
        queries_resp = await self.llm.ainvoke(query_prompt)
        queries = queries_resp.content.split("\n")
        
        # 2. Simulate/Perform search
        search_results = []
        for q in queries[:2]: # Top 2 queries
            res = await self.search_google(q)
            search_results.append(res)
            
        # 3. Synthesize final answer
        synthesis_prompt = (
            f"You are a Senior Researcher. Synthesize a comprehensive answer for: '{last_message}'\n\n"
            f"Context from search: {str(search_results)}\n\n"
            "Provide a structured response with academic depth."
        )
        
        response = await self.llm.ainvoke(synthesis_prompt)
        
        return {"messages": [response]}

# Export a callable for the graph
researcher = ResearchAgent()

async def research_node(state: AgentState):
    return await researcher.run(state)
