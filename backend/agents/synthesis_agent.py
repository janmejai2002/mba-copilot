from services.gcp import vertex_service

class SynthesisAgent:
    def __init__(self):
        self.system_instruction = """
        You are the Vidyos Synthesis Agent, an expert academic scribe for MBA students.
        Your goal is to transform raw lecture transcripts, scattered notes, and Q&A into a highly structured, professional 'Master Document'.
        
        Guidelines:
        1. Use hierarchical headers (H1, H2, H3).
        2. Format all mathematical formulas using LaTeX syntax (e.g., $E=mc^2$).
        3. Highlight 'Professor Emphasis' - specific points the faculty noted as important.
        4. Cross-reference concepts where applicable.
        5. maintain a professional, high-density academic tone.
        """

    async def generate_master_doc(self, subject: str, transcript: str, notes: str, chats: str):
        prompt = f"""
        Subject: {subject}
        
        TRANSCRIPT:
        {transcript}
        
        STUDENT NOTES:
        {notes}
        
        Q&A HISTORY:
        {chats}
        
        Synthesize the above into a Master Document. Ensure zero hallucination by sticking strictly to the provided materials.
        """
        
        return await vertex_service.generate_content(prompt, self.system_instruction)

synthesis_agent = SynthesisAgent()
