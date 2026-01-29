
import React from 'react';

const TermsOfService: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 text-[#1d1d1f]">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="mb-4 text-black/60">Last updated: January 29, 2026</p>

            <section className="space-y-8 text-black/80">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">1. Agreement to Terms</h2>
                    <p className="leading-relaxed">
                        Vidyos ("The Platform") is a productivity tool for academic lecture analysis. By accessing the site, you agree to these Terms. If you do not agree, you must cease use immediately.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">2. Recording Ethics & Consent</h2>
                    <p className="leading-relaxed">
                        You represent and warrant that you have obtained all necessary permissions from instructors, presenters, and educational institutions before recording any audio or video. Vidyos disclaims all liability for unauthorized recordings made by users.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">3. AI Accuracy & "Hallucinations"</h2>
                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl">
                        <p className="font-bold text-orange-900 mb-2">IMPORTANT: AI Performance Disclaimer</p>
                        <p className="text-sm text-orange-800 leading-relaxed">
                            Vidyos uses Large Language Models to generate summaries, insights, and knowledge graphs. You acknowledge that AI can produce "hallucinations"—information that is factually incorrect, biased, or fabricated. Vidyos is a study AID and should NOT be used as a primary source for graded assignments or professional advice. Always verify AI outputs against your original lecture the materials.
                        </p>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">4. Neural Credits & Subscriptions</h2>
                    <p className="leading-relaxed mb-4">
                        Payments for "Sovereign Tier" or Neural Credits are handled by third-party processors. Credits are consumed on-demand for AI operations and are non-refundable once the operation has been initiated.
                    </p>
                    <a href="#refund-policy" className="text-[var(--vidyos-teal)] font-bold underline">View Refund & Cancellation Policy</a>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">5. Limitation of Liability</h2>
                    <p className="leading-relaxed">
                        To the maximum extent permitted by law (including the DPDP Act 2025 where applicable), Vidyos, its creators, and affiliates shall not be liable for any incidental, direct, or indirect damages, including academic failure, data loss, or privacy breaches arising from user-side mismanagement.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default TermsOfService;
