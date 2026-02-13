"""
Test Google Cloud Speech-to-Text V2 (Chirp) - Real API Test
Uses Google TTS to generate audio, then transcribes with Chirp.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

RESULTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_chirp_results.txt")
results = []

def log(msg):
    print(msg, flush=True)
    results.append(msg)

def save():
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(results))

def test_chirp():
    log("=" * 60)
    log("TEST: Google Cloud Speech-to-Text V2 (Chirp)")
    log("=" * 60)
    log(f"Project: {os.environ.get('GCP_PROJECT')}")
    log(f"Location: {os.environ.get('GCP_LOCATION')}")
    log(f"Credentials: {os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')}")
    log("")

    # Step 1: Generate test audio using Google TTS
    log("Step 1: Generating test audio via Google TTS...")
    try:
        from google.cloud import texttospeech

        tts_client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(
            text="Net Present Value is the difference between the present value of cash inflows and outflows. It is used to evaluate investment profitability in corporate finance."
        )
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-IN",
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
        )

        tts_response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        audio_content = tts_response.audio_content
        log(f"  ✅ Generated {len(audio_content)} bytes of audio")

        # Save for inspection
        with open("test_audio.wav", "wb") as f:
            f.write(audio_content)
        log("  ✅ Saved as test_audio.wav")
    except Exception as e:
        log(f"  ❌ TTS Failed: {e}")
        log("  Falling back to testing with raw config only...")
        save()
        return False

    # Step 2: Transcribe with Chirp via Speech V2
    log("")
    log("Step 2: Transcribing with Google Chirp (Speech-to-Text V2)...")
    try:
        from google.cloud import speech_v2 as speech

        project_id = os.environ.get("GCP_PROJECT", "mba-copilot-485805")
        location = "global"

        client = speech.SpeechClient()

        config = speech.RecognitionConfig(
            auto_decoding_config=speech.AutoDetectDecodingConfig(),
            language_codes=["en-IN", "hi-IN"],
            model="chirp_2",
            features=speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True,
            ),
        )

        recognizer_name = f"projects/{project_id}/locations/{location}/recognizers/_"

        start = time.time()
        request = speech.RecognizeRequest(
            recognizer=recognizer_name,
            config=config,
            content=audio_content,
        )

        response = client.recognize(request=request)
        elapsed = time.time() - start

        transcript_parts = []
        for result in response.results:
            if result.alternatives:
                alt = result.alternatives[0]
                transcript_parts.append(alt.transcript)
                log(f"  📝 Transcript: \"{alt.transcript}\"")
                log(f"  📊 Confidence: {alt.confidence:.2%}")

                # Show word timestamps
                if alt.words:
                    for w in alt.words[:5]:  # first 5 words
                        log(f"     🔤 '{w.word}' @ {w.start_offset.total_seconds():.1f}s - {w.end_offset.total_seconds():.1f}s")

        full_transcript = " ".join(transcript_parts)
        log(f"")
        log(f"  ✅ Chirp transcription completed in {elapsed:.1f}s")
        log(f"  ✅ Full transcript: \"{full_transcript}\"")
        log(f"  ✅ Results count: {len(response.results)}")
        save()
        return True

    except Exception as e:
        log(f"  ❌ Chirp FAILED: {e}")
        import traceback
        traceback.print_exc()
        log(traceback.format_exc())
        save()
        return False

    # Step 3: Also test the FastAPI endpoint
    log("")
    log("Step 3: Testing FastAPI /api/agent/transcribe endpoint...")
    try:
        from main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)
        with open("test_audio.wav", "rb") as f:
            res = client.post(
                "/api/agent/transcribe",
                files={"audio": ("test.wav", f, "audio/wav")},
                data={"language": "en-IN", "model": "chirp_2"}
            )

        data = res.json()
        log(f"  ✅ Endpoint Status: {res.status_code}")
        log(f"  ✅ Transcript: \"{data.get('transcript', 'N/A')}\"")
        log(f"  ✅ Confidence: {data.get('confidence', 'N/A')}")
        save()
        return True
    except Exception as e:
        log(f"  ❌ Endpoint FAILED: {e}")
        save()
        return False


if __name__ == "__main__":
    log("🎙️ GOOGLE CHIRP STT - REAL INTEGRATION TEST")
    log(f"📅 {time.strftime('%Y-%m-%d %H:%M:%S')}")
    log("")

    ok = test_chirp()

    log("")
    log("=" * 60)
    log(f"📊 RESULT: {'✅ PASSED' if ok else '❌ FAILED'}")
    log("=" * 60)
    save()
