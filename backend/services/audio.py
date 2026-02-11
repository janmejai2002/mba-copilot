
import os
import asyncio
from google.cloud import speech_v2
from google.cloud.speech_v2.types import cloud_speech
from dotenv import load_dotenv

load_dotenv()

class AudioStreamer:
    """
    Handles real-time audio transcription using GCP Speech-to-Text V2 (Chirp v2).
    Optimized for Hinglish (Hindi + English) code-switching.
    """
    def __init__(self):
        self.project_id = os.getenv("GCP_PROJECT")
        self.location = os.getenv("GCP_LOCATION", "us-central1")
        self.client = speech_v2.SpeechAsyncClient()
        
        # Recognize config for Chirp v2
        self.recognizer_id = "chirp-v2-recognizer"
        
    async def transcribe_stream(self, audio_generator):
        """
        Processes an async generator of audio chunks and yields transcription results.
        """
        # Note: In a real production environment, you would first create/get a Recognizer.
        # For simplicity in this implementation, we use inline configuration.
        
        config = cloud_speech.RecognitionConfig(
            auto_decoding_config=cloud_speech.AutoDetectDecodingConfig(),
            language_codes=["en-IN", "hi-IN"], # Dual language for Hinglish
            model="long", # 'long' is used for USM/Chirp
            features=cloud_speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True
            )
        )
        
        streaming_config = cloud_speech.StreamingRecognitionConfig(config=config)
        
        # The first request must contain only the streaming configuration
        first_request = cloud_speech.StreamingRecognizeRequest(
            recognizer=f"projects/{self.project_id}/locations/{self.location}/recognizers/_",
            streaming_config=streaming_config
        )
        
        async def request_generator():
            yield first_request
            async for chunk in audio_generator:
                yield cloud_speech.StreamingRecognizeRequest(audio=chunk)

        try:
            responses = await self.client.streaming_recognize(requests=request_generator())
            
            async for response in responses:
                for result in response.results:
                    if result.is_final:
                        transcript = result.alternatives[0].transcript
                        confidence = result.alternatives[0].confidence
                        yield {
                            "text": transcript,
                            "confidence": confidence,
                            "is_final": True
                        }
                    else:
                        # Interim results
                        transcript = result.alternatives[0].transcript
                        yield {
                            "text": transcript,
                            "is_final": False
                        }
        except Exception as e:
            print(f"Transcription Error: {e}")
            yield {"error": str(e)}

audio_streamer = AudioStreamer()
