from typing import TypedDict, Annotated, List, Union, Dict, Any
import operator
from langchain_core.messages import BaseMessage

class UserContext(TypedDict):
    current_page: str
    user_focus: str  # e.g., "Variance Analysis Node"
    task_history: List[str]
    learning_style: str # e.g., "Visual", "Auditory", "Textual"
    mastery_levels: Dict[str, str] # e.g., {"Finance": "Beginner", "Strategy": "Expert"}

class GraphContext(TypedDict):
    """Context regarding the Knowledge Graph's current view"""
    visible_nodes: List[str]
    selected_node: str
    expansion_history: List[str]

class AgentState(TypedDict):
    # The list of messages in the conversation
    messages: Annotated[List[BaseMessage], operator.add]
    # The distinct context of the user's session
    user_context: UserContext
    # The state of the knowledge graph visualization
    graph_context: GraphContext
    # The next agent to act
    next: str
