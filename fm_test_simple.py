
import urllib.request
import json
import socket

BACKEND_URL = "https://vidyos-backend-1066396672407.us-central1.run.app"

def test_chat(message):
    print(f"Testing: {message}")
    url = f"{BACKEND_URL}/api/agent/chat"
    payload = {
        "message": message,
        "session_id": "fm-verification-test",
        "user_context": {"current_page": "SessionView", "user_focus": "Financial Management"}
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            res = json.loads(response.read().decode('utf-8'))
            print(f"SUCCESS: {json.dumps(res, indent=2)}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_chat("Explain the concept of Capital Structure and how it affects firm value.")
    test_chat("Generate a visual risk-return chart for an aggressive portfolio.")
