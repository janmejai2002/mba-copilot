from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from core.state import AgentState
import os


# Initialize Gemini 2.5 Pro (Vertex AI) - Latest Stable GA
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0,
    max_output_tokens=2048,
    location=os.environ.get("GCP_LOCATION", "us-central1")
)

# --- Router Logic ---
system_prompt = (
    "You are the MasterMind of the Vidyos Knowledge System. "
    "Your job is to route the user's request to the appropriate specialist agent based on their intent and context.\n"
    "\n"
    "Available Agents:\n"
    "1. ScribeAgent: For processing live audio, transcribing lectures, or summarizing raw notes.\n"
    "2. NavigatorAgent: For exploring the knowledge graph, expanding nodes, or explaining concepts visually.\n"
    "3. ResearchAgent: For answering specific doubts, finding facts, or researching topics outside the graph.\n"
    "4. CurriculumMaster: For adjusting learning paths, checking mastery levels, or pruning content.\n"
    "5. ProfessorAgent: For deep academic dives, exam predictions, and advanced theoretical explanations.\n"
    "6. ArtistAgent: For generating diagrams, visual aids, or sketches of concepts.\n"
    "7. ComposerAgent: For generating audio summaries or podcasts of the content.\n"
    "\n"
    "If the request is fully answered or the task is finished, return 'DONE'.\n"
    "\n"
    "User Context:\n"
    "Current Page: {current_page}\n"
    "User Focus: {user_focus}\n"
    "\n"
    "Return the agent name or 'DONE'."
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}")
])

chain = prompt | llm

def supervisor_node(state: AgentState):
    """
    The MasterMind node that decides which agent to call next.
    """
    messages = state.get("messages", [])
    if not messages:
        return {"next": "DONE"}
        
    user_message = messages[-1].content
    user_context = state.get("user_context", {})
    
    result = chain.invoke({
        "input": user_message,
        "current_page": user_context.get("current_page", "Unknown"),
        "user_focus": user_context.get("user_focus", "None")
    })
    
    decision = result.content.strip()
    
    # Mapping table for routing
    mapping = {
        "Scribe": "ScribeAgent",
        "Navigator": "NavigatorAgent",
        "Research": "ResearchAgent",
        "Curriculum": "CurriculumMaster",
        "Professor": "ProfessorAgent",
        "Artist": "ArtistAgent",
        "Composer": "ComposerAgent",
        "DONE": "DONE"
    }
    
    for key, val in mapping.items():
        if key.lower() in decision.lower():
            return {"next": val}
    
    return {"next": "DONE"}

# Import Sub-Agents
from agents.scribe import scribe_node
from agents.navigator import navigator_node
from agents.researcher import research_node
from agents.professor import professor_node
from agents.curriculum import curriculum_node
from agents.artist import artist_node
from agents.composer import composer_node

# --- Graph Construction ---
workflow = StateGraph(AgentState)

workflow.add_node("MasterMind", supervisor_node)
workflow.add_node("ScribeAgent", scribe_node)
workflow.add_node("NavigatorAgent", navigator_node)
workflow.add_node("ResearchAgent", research_node)
workflow.add_node("ProfessorAgent", professor_node)
workflow.add_node("CurriculumMaster", curriculum_node)
workflow.add_node("ArtistAgent", artist_node)
workflow.add_node("ComposerAgent", composer_node)

workflow.set_entry_point("MasterMind")

# All agents return to MasterMind for evaluation (Multi-turn Loop)
workflow.add_edge("ScribeAgent", "MasterMind")
workflow.add_edge("NavigatorAgent", "MasterMind")
workflow.add_edge("ResearchAgent", "MasterMind")
workflow.add_edge("CurriculumMaster", "MasterMind")
workflow.add_edge("ProfessorAgent", "MasterMind")
workflow.add_edge("ArtistAgent", "MasterMind")
workflow.add_edge("ComposerAgent", "MasterMind")

workflow.add_conditional_edges(
    "MasterMind",
    lambda x: x["next"],
    {
        "ScribeAgent": "ScribeAgent",
        "NavigatorAgent": "NavigatorAgent",
        "ResearchAgent": "ResearchAgent",
        "CurriculumMaster": "CurriculumMaster",
        "ProfessorAgent": "ProfessorAgent",
        "ArtistAgent": "ArtistAgent",
        "ComposerAgent": "ComposerAgent",
        "DONE": END
    }
)

master_graph = workflow.compile()
