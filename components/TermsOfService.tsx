
import React from 'react';

const TermsOfService: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 text-[#1d1d1f]">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="mb-4 text-black/60">Last updated: January 29, 2026</p>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
                <p>
                    By using MBA Copilot, you agree to these terms. This is a tool designed to assist
                    students in recording and analyzing their academic lectures.
                </p>

                <h2 className="text-2xl font-bold">2. User Responsibility</h2>
                <p>
                    You are solely responsible for compliance with legal requirements regarding the
                    recording of lectures and conversations. You must obtain necessary permissions
                    from instructors or educational institutions before recording.
                </p>

                <h2 className="text-2xl font-bold">3. Account Safety</h2>
                <p>
                    Your data is tied to your Google Account. Keeping your Google Account secure is
                    your responsibility.
                </p>

                <h2 className="text-2xl font-bold">4. Limitation of Liability</h2>
                <p>
                    MBA Copilot is provided "as is". We are not responsible for data loss,
                    transcription errors, or any academic consequences resulting from the use of
                    this tool.
                </p>
            </section>
        </div>
    );
};

export default TermsOfService;
