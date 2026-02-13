
import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path to simulate Cloud Run environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

print("Testing MasterMind Import...")

try:
    # Attempt to import the master_graph
    # This triggers the graph compilation and LLM initialization
    # Note: agents is top-level because backend/ is in sys.path
    from agents.mastermind import master_graph
    print("✅ MasterMind Agent imported and Graph compiled successfully!")
except Exception as e:
    print(f"❌ Failed to import MasterMind: {e}")
    # Print detailed traceback
    import traceback
    traceback.print_exc()
