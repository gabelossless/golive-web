'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function PrivacyPage() {
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
                                Privacy Policy
                            </h1>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
                                Last Updated: March 2026
                            </p>
                        </header>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">1. Data Minimization</h2>
                            <p className="leading-relaxed">
                                Zenith is designed for the decentralized web. We collect minimal personal data. Your interactions are primarily recorded on public blockchains (Base and Solana), which are public by nature.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">2. Information We Collect</h2>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Public Wallet Addresses (to facilitate tipping)</li>
                                <li>Account metadata provided during sign-up</li>
                                <li>Usage statistics to improve the global experience</li>
                            </ul>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">3. Cookies & Tracking</h2>
                            <p className="leading-relaxed">
                                We use essential cookies to keep you signed in. We do not sell your data to third-party advertisers. Our goal is viral success through quality, not surveillance.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">4. Global Compliance</h2>
                            <p className="leading-relaxed">
                                We strive to comply with international data protection standards. If you have questions about your data, contact our security team via the Help section.
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
