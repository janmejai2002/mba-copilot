
import os
import json
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from core.db import get_db_connection

class ScribeAgent:
    """
    The Weaver. 
    Extracts structured knowledge (Concepts, Relations) from text
    and updates the graph database.
    """
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.1,
            location=os.environ.get("GCP_LOCATION", "us-central1")
        )
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004", # Latest embedding model
            task_type="retrieval_document"
        )

    async def process_transcript(self, session_id: str, text: str) -> List[Dict[str, Any]]:
        """
        Main entry point for processing a transcript segment.
        """
        # 1. Extract concepts and relations via LLM
        extraction = await self._extract_knowledge(text)
        
        # 2. Store in DB
        processed_nodes = []
        for node in extraction.get("nodes", []):
            node_id = await self._upsert_node(node)
            processed_nodes.append({**node, "id": str(node_id)})
            
        for edge in extraction.get("edges", []):
            await self._upsert_edge(edge, nodes=processed_nodes)
            
        return processed_nodes

    async def _extract_knowledge(self, text: str) -> Dict[str, Any]:
        """
        Uses LLM to extract JSON nodes and edges.
        """
        prompt = ChatPromptTemplate.from_template("""
        You are a Knowledge Graph Engineer. Extract core concepts and their relationships from the following transcript segment.
        
        Transcript: "{text}"
        
        Return ONLY a JSON object with this structure:
        {{
            "nodes": [
                {{ "label": "Concept Name", "type": "Concept/Theorem/Event", "content": "Short definition" }}
            ],
            "edges": [
                {{ "source": "Concept A", "target": "Concept B", "relation": "Prerequisite/Extends/Contradicts" }}
            ]
        }}
        
        Rules:
        - Labels should be concise (1-3 words).
        - Type must be one of: Concept, Theorem, Event.
        - Relation must be one of: Prerequisite, Extends, Contradicts.
        """)
        
        chain = prompt | self.llm
        response = await chain.ainvoke({"text": text})
        
        try:
            # Clean JSON if LLM adds markdown backticks
            content = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            print(f"JSON Parse Error in ScribeAgent: {e}")
            return {"nodes": [], "edges": []}

    async def _upsert_node(self, node: Dict[str, Any]):
        """
        Inserts or updates a concept node.
        """
        try:
            conn = await get_db_connection()
        except Exception as e:
            print(f"❌ DB Connection Error in ScribeAgent: {e}")
            return "dummy-node-id"

        try:
            # Generate embedding
            raw_embedding = await self.embeddings.aembed_query(node["content"])
            
            # Check if node exists by label
            row = await conn.fetchrow(
                "SELECT id FROM knowledge_nodes WHERE label = $1", 
                node["label"]
            )
            
            if row:
                node_id = row['id']
                await conn.execute(
                    "UPDATE knowledge_nodes SET content = $1, embedding = $2, metadata = $3 WHERE id = $4",
                    node["content"], raw_embedding, json.dumps(node), node_id
                )
            else:
                node_id = await conn.fetchval(
                    "INSERT INTO knowledge_nodes (label, type, content, embedding, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                    node["label"], node["type"], node["content"], raw_embedding, json.dumps(node)
                )
            return node_id
        except Exception as e:
            print(f"❌ Upsert Node Error: {e}")
            return "error-node-id"
        finally:
            await conn.close()

    async def _upsert_edge(self, edge: Dict[str, Any], nodes: List[Dict[str, Any]]):
        """
        Inserts a relationship between nodes.
        """
        source_id = next((n["id"] for n in nodes if n["label"] == edge["source"]), None)
        target_id = next((n["id"] for n in nodes if n["label"] == edge["target"]), None)
        
        if not source_id or not target_id or source_id == "error-node-id" or target_id == "error-node-id":
            return 
            
        try:
            conn = await get_db_connection()
        except Exception as e:
            print(f"❌ DB Connection Error for Edge: {e}")
            return

        try:
            await conn.execute(
                "INSERT INTO knowledge_edges (source_id, target_id, relation) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                source_id, target_id, edge["relation"]
            )
        except Exception as e:
            print(f"❌ Upsert Edge Error: {e}")
        finally:
            await conn.close()

scribe_agent = ScribeAgent()
