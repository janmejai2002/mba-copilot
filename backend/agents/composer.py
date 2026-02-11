
import os
from google.cloud import texttospeech
from core.state import AgentState

class ComposerAgent:
    """
    The Composer.
    Transforms graph descriptions into lifelike audio summaries (podcasts) using Google Cloud TTS.
    """
    def __init__(self):
        self.client = texttospeech.TextToSpeechClient()
        self.voice = texttospeech.VoiceSelectionParams(
            language_code="en-IN", # Hinglish friendly or standard Indian English
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        self.audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

    async def run(self, state: AgentState):
        """
        Generates speech for the current graph context.
        """
        messages = state["messages"]
        last_message = messages[-1].content
        
        # In a real app, we'd save to GCS and return a URL.
        # For now, we simulate the 'Composer working' response.
        
        # input_text = texttospeech.SynthesisInput(text=last_message)
        # response = self.client.synthesize_speech(
        #     input=input_text, voice=self.voice, audio_config=self.audio_config
        # )
        
        return {"messages": [f"ComposerAgent: I am composing a voice summary of '{last_message[:50]}...' using Google TTS."]}

# Export for LangGraph
composer_agent = ComposerAgent()

async def composer_node(state: AgentState):
    return await composer_agent.run(state)
