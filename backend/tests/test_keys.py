
import os
import google.auth
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

def test_auth():
    print("🔍 Testing Google Auth...")
    try:
        credentials, project = google.auth.default()
        print(f"✅ Auth successful. Project: {project}")
        
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
        print("🚀 Testing Gemini API call (Flash)...")
        res = llm.invoke("Hello, are you working?")
        print(f"✅ Gemini Response: {res.content}")
        
    except Exception as e:
        print(f"❌ Auth/API Error: {e}")

if __name__ == "__main__":
    test_auth()
