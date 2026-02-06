# Implementation Plan: "Fastest & Best" GCP Migration

This plan optimizes for **Maximum Speed** (Latency), **Best Quality** (Hinglish/Context), and **Thinking Seamlessness** (Zero Data Loss).

---

## Technology Decisions: "The Best Tool for Each Job"

| Feature | Selected Tech | Why "Best & Fastest"? |
|---------|---------------|-----------------------|
| **Transcription** | **Google Chirp 3** | **Best Accuracy** for "Hinglish" & code-switching. Native GCP integration (no extra hops). |
| **Summarization** | **Gemini 1.5 Flash** | **Best Context** (1M tokens) for long lectures. Faster (~166 t/s) than Pro models. |
| **Q&A / Search** | **Perplexity/Sonar** | **Best Knowledge** retrieval for academic queries. |
| **Real-time DB** | **Firestore** | **Fastest Sync** (<100ms) compared to GDrive polling. Real-time listeners. |
| **Compute** | **Cloud Run** | **Fastest Scale**. Auto-scales to zero. WebSockets supported. |
| **Region** | **asia-south1 (Mumbai)** | **Lowest Latency** (~30-50ms) for Indian users. |

---

## Architecture: The "Speed-First" GCP Backend

```mermaid
graph TB
    subgraph "Clients"
        Web[Web App]
        Mobile[Mobile App]
    end

    subgraph "GCP Global Infrastructure"
        LB[Global HTTPS Load Balancer]
        IP[Static Global IP]
    end

    subgraph "Cloud Run (asia-south1)"
        API[FastAPI Service]
        Events[Event Loop]
    end

    subgraph "Data & AI"
        STT[Chirp 3 (gRPC)]
        FS[(Firestore Realtime)]
        Gemini[Gemini 1.5 Flash]
    end

    Web -->|WebSocket| LB --> API
    API -->|gRPC Stream| STT
    API -->|Async| FS
    API -->|REST| Gemini
```

---

## Step-by-Step Migration Plan

### Phase 1: Infrastructure & Domain (Seamless Switch)
**Goal:** Setup "Shadow Backend" while current site stays live.

1.  **GCP Project Setup**
    *   Create Project: `vidyos-core`
    *   Enable APIs: `speech.googleapis.com`, `firestore.googleapis.com`, `run.googleapis.com`
    *   **Reserve Static Global IP** (Key for domain transfer)

2.  **Domain Transfer Plan (Zero Downtime)**
    *   *Current Domain*: Pointed to Vercel.
    *   *Step 1*: Setup GCP Load Balancer with the Static IP.
    *   *Step 2*: Create `api.vidyos.space` (subdomain) pointing to GCP IP.
    *   *Step 3*: Verify SSL via Google Managed Certificates.
    *   *Step 4 (Final)*: Switch main A-record to GCP IP.

---

### Phase 2: High-Performance Backend (Python/FastAPI)

#### 1. Chirp 3 Streaming Bridge
Implement a persistent WebSocket bridge. Browser sends raw audio → Server relays via gRPC to Chirp 3.

```python
# Speed Optimization: Keep connection open, stream chunks immediately
@app.websocket("/ws/transcribe")
async def transcribe_endpoint(websocket: WebSocket):
    await websocket.accept()
    # gRPC connection to Chirp 3 (asia-south1)
    # ... streaming logic ...
```

#### 2. Gemini 1.5 Flash Gateway
Proxy designed for speed. Streaming response (server-sent events) to UI.

#### 3. Firestore "Hot State"
Move **Active Session** data to Firestore for sub-100ms sync between laptop & mobile.
*   *Write*: User speaks → Text → Firestore
*   *Read*: Mobile watches Firestore document → UI updates instantly

---

### Phase 3: Frontend "Brain Transplant"

1.  **New Hook: `useChirpSteam`**
    *   Connects to `/ws/transcribe` on GCP
    *   Handles audio resampling (WebAudio API) to 16kHz linear PCM (required by Chirp)

2.  **New Service: `live-sync.ts`**
    *   Replaces polling mechanisms with `onSnapshot` (Firestore real-time listener)
    *   "Magic Update": Change slide on phone → shows on Laptop in <100ms

3.  **Fix Features**
    *   **Summarize**: Update prompt to enforce JSON mode for Gemini 1.5 Flash.
    *   **Knowledge Graph**: Use robust error handling for `extractKeywords`.

---

### Phase 4: Data Migration (Zero Loss)

1.  **Users & Credits**:
    *   Export Vercel/Supabase user table.
    *   Import to Firestore `users` collection.
    *   *Optimization*: Store credits in Firestore for atomic transactions.

2.  **Subject/Session Archives**:
    *   **Keep in Drive**: Historical data stays in Google Drive (cheaper, user-owned).
    *   **Index in Firestore**: Store metadata (ID, Title, Date) in Firestore for fast searching.

---

## Timeline

*   **Day 1**: GCP Setup, Static IP, Domain SSL verification (Shadow).
*   **Day 2**: Backend Code (Chirp 3 + Gemini Bridge).
*   **Day 3**: Frontend Wiring (WebSockets + Firestore).
*   **Day 4**: Testing (Hinglish Accuracy & Sync Speed).
*   **Day 5**: DNS Switch (Go Live).

---

## Recommended User Actions

1.  **Authorize**: I will need you to login to `gcloud` (I can guide you) or provide a service account key if you want me to deploy from here (or I provide the code for you to push).
2.  **Domain Control**: You will need access to your DNS provider (e.g., GoDaddy/Namecheap) for the final switch.
