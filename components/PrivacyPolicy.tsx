
import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 text-[#1d1d1f]">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="mb-4 text-black/60">Last updated: January 29, 2026</p>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">1. Data Storage</h2>
                <p>
                    MBA Copilot is designed with a privacy-first approach. We do not store your recordings,
                    transcripts, or personal data on our servers. All application data is stored in your personal
                    Google Drive account within a specialized "App Data Folder".
                </p>

                <h2 className="text-2xl font-bold">2. Google Drive Access</h2>
                <p>
                    Our application requests access to the <code>drive.appdata</code> scope. This allows the app to
                    create and modify files only within its own hidden folder in your Google Drive.
                    We cannot see or access your other personal files or folders.
                </p>

                <h2 className="text-2xl font-bold">3. Local Storage</h2>
                <p>
                    A copy of your data is cached in your browser's local database (IndexedDB) to provide
                    a fast, offline-capable experience. This data remains on your device.
                </p>

                <h2 className="text-2xl font-bold">4. AI Analysis</h2>
                <p>
                    When you request an AI summary or analysis, the transcript of your class is sent to
                    Google Gemini or Deepgram via secure API calls. These services do not use your
                    private data to train their public models.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
