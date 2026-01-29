
import React from 'react';

const RefundPolicy: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 text-[#1d1d1f]">
            <h1 className="text-4xl font-bold mb-8">Refund & Cancellation Policy</h1>
            <p className="mb-4 text-black/60">Last updated: January 29, 2026</p>

            <section className="space-y-8 text-black/80">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">1. Digital Consumption</h2>
                    <p className="leading-relaxed">
                        Vidyos provides digital services including AI synthesis and transcription. Once a "Neural Credit" has been consumed for an AI operation, it is non-refundable. High-compute AI costs are incurred instantly upon request.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">2. Subscription Cancellation</h2>
                    <p className="leading-relaxed">
                        You may cancel your "Sovereign Tier" subscription at any time via the Settings panel. Upon cancellation, you will retain access to Sovereign features until the end of your current billing cycle. No partial refunds are provided for mid-month cancellations.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">3. Refund Requests</h2>
                    <p className="leading-relaxed mb-4">
                        Refunds may be granted at our sole discretion in the following cases:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Technical failure of the platform preventing service delivery for more than 48 hours.</li>
                        <li>Duplicate billing due to payment gateway errors.</li>
                    </ul>
                    <p className="mt-4">
                        To request a refund, contact <code>billing@vidyos.ai</code> with your transaction ID.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 text-black">4. Chargebacks</h2>
                    <p className="leading-relaxed">
                        Fraudulent chargebacks will result in immediate permanent suspension of the associated Google account from the Vidyos platform and forfeiture of all stored data.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default RefundPolicy;
