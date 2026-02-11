
import os
import asyncio
import asyncpg
from google.cloud.sql.connector import Connector, IPTypes

# Function to get current event loop or create one
def get_loop():
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.new_event_loop()

async def get_db_connection():
    """
    Establishes a connection to Cloud SQL using the Python Connector.
    """
    instance_connection_name = os.environ.get("INSTANCE_CONNECTION_NAME")
    db_user = os.environ.get("DB_USER", "vidyos_admin")
    db_pass = os.environ.get("DB_PASS", "SecureGraphPass2026!")
    db_name = os.environ.get("DB_NAME", "vidyos_knowledge_graph")

    # If running locally without env var, try to construct it or fail
    if not instance_connection_name:
        project_id = os.environ.get("GCP_PROJECT", "mba-copilot-485805")
        region = os.environ.get("GCP_LOCATION", "us-central1")
        instance = "vidyos-graph-db"
        instance_connection_name = f"{project_id}:{region}:{instance}"

    loop = get_loop()
    
    # Initialize connector
    connector = Connector(loop=loop)

    async def getdict(conn):
        return dict(conn)

    conn: asyncpg.Connection = await connector.connect_async(
        instance_connection_name,
        "asyncpg",
        user=db_user,
        password=db_pass,
        db=db_name,
        ip_type=IPTypes.PUBLIC  # Use PUBLIC for local dev, PRIVATE for Cloud Run if VPC configured
    )
    
    return conn

async def init_db_schema():
    """
    Creates the necessary tables for the Knowledge Graph.
    """
    conn = await get_db_connection()
    try:
        # 1. Enable pgvector
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # 2. Create Nodes Table (The Concepts)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_nodes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                label TEXT NOT NULL,
                type TEXT NOT NULL, -- 'Concept', 'Theorem', 'Event'
                content TEXT,
                embedding vector(768), -- Gemini Embedding Dimension
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        
        # 3. Create Edges Table (The Relationships)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_edges (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source_id UUID REFERENCES knowledge_nodes(id),
                target_id UUID REFERENCES knowledge_nodes(id),
                relation TEXT NOT NULL, -- 'Prerequisite', 'Extends', 'Contradicts'
                weight FLOAT DEFAULT 1.0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)

        # 4. Create User Mastery Table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_mastery (
                user_id UUID NOT NULL, -- Placeholder for actual user system
                node_id UUID REFERENCES knowledge_nodes(id),
                mastery_level TEXT NOT NULL DEFAULT 'Beginner', -- 'Beginner', 'Intermediate', 'Advanced'
                score FLOAT DEFAULT 0.0,
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (user_id, node_id)
            );
        """)
        
        # 4. Create Index for Vector Search (IVFFlat or HNSW)
        # Note: Requires some data to be effective, but creating shell here
        # await conn.execute("CREATE INDEX ON knowledge_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);")
        
        print("✅ Database Schema Initialized successfully!")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    # Run initialization
    asyncio.run(init_db_schema())
