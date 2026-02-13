
import requests
import re

url = "https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

with open("model_ids.txt", "w") as f:
    f.write(f"Fetching {url}...\n")
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        content = response.text
        
        # Search for gemini-1.5 patterns
        matches = re.findall(r'gemini-1\.5-[a-z0-9-]+', content)
        unique_matches = sorted(set(matches))
        
        f.write("\nPotential Model IDs found:\n")
        for match in unique_matches:
            f.write(f"- {match}\n")
            
        if not matches:
            f.write("No matches found. The page might be protected or use JavaScript to load content.\n")
            
        # Also look for 'Stable' and 'GA' near gemini strings
        ga_matches = re.findall(r'gemini-1\.5-[a-z0-9-]+.*?stable', content, re.IGNORECASE | re.DOTALL)
        if ga_matches:
            f.write("\nStable identifiers found in text:\n")
            for m in set(ga_matches):
                cleaned = re.search(r'gemini-1\.5-[a-z0-9-]+', m).group(0)
                f.write(f"- {cleaned}\n")
                
    except Exception as e:
        f.write(f"Error: {e}\n")

print("Scrape complete. Results in model_ids.txt")
