'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function TermsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    return (
        <div className="flex h-screen bg-[#0a0a0a] text-zinc-300">
            <Sidebar isOpen={isSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 overflow-y-auto p-8 lg:p-16">
                    <div className="max-w-4xl mx-auto space-y-12 pb-32">
                        <header className="space-y-4">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">
                                Terms of Service
                            </h1>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
                                Last Updated: March 2026
                            </p>
                        </header>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">1. Acceptance of Terms</h2>
                            <p className="leading-relaxed">
                                By accessing Zenith, you agree to be bound by these Terms. If you do not agree, do not use the platform. Zenith provides a decentralized-first media experience.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">2. Crypto Disclaimers</h2>
                            <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-4">
                                <p className="text-orange-200 font-bold">IMPORTANT: Zenith is a non-custodial platform.</p>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    <li>We do not hold your private keys.</li>
                                    <li>Transactions on the blockchain are irreversible.</li>
                                    <li>Zenith is not responsible for lost funds due to user error or wallet compromise.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">3. Global Content Policy</h2>
                            <p className="leading-relaxed">
                                We aim for billion-dollar global success. This requires a standard of excellence. Users must not upload illegal, harmful, or copyright-infringement material. We reserve the right to "Shadow-Guard" (soft-moderate) content that threatens platform stability.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">4. Limitation of Liability</h2>
                            <p className="leading-relaxed">
                                Zenith is provided "as is". We are not liable for any financial losses, including those related to cryptocurrency price volatility or blockchain network failures.
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
