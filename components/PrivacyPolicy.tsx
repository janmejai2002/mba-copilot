
import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 text-[#1d1d1f]">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="mb-4 text-black/60">Last updated: January 29, 2026</p>

            <section className="space-y-8 text-black/80">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">1. Data Sovereignty & Storage</h2>
                    <p className="leading-relaxed">
                        Vidyos operates on a "User-Sovereign" architecture. We do not maintain a central database of your audio, transcripts, or notes. All personal data is stored directly in your personal Google Drive within the <code>drive.appdata</code> (Hidden App Data) folder.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">2. Information We Process</h2>
                    <p className="leading-relaxed mb-4">
                        To provide the service, we process the following:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Audio Sync:</strong> Processed in real-time via Deepgram for transcription. Not stored by us.</li>
                        <li><strong>Neural Metadata:</strong> Credits, Tier, and Usage history stored locally and synced to your Drive.</li>
                        <li><strong>AI Grounding:</strong> Transcripts are sent to Google Gemini for synthesis. These services do not use your private data for model training.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">3. Your Rights (DPDP Act 2025)</h2>
                    <p className="leading-relaxed mb-4">
                        Under the Digital Personal Data Protection Act (India), you have the right to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Right to Access:</strong> See all data stored (Viewable in your Google Drive).</li>
                        <li><strong>Right to Erasure:</strong> Delete all data instantly via the App Settings.</li>
                        <li><strong>Right to Grievance:</strong> Contact our Data Protection Officer (DPO) at <code>privacy@vidyos.ai</code>.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">4. Cookies & Hardware Identity</h2>
                    <p className="leading-relaxed">
                        We use a hardware fingerprinting protocol ("Sovereign Shield") to prevent platform abuse. This identity is used solely for credit quota management and is not tied to your real-world identity.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
