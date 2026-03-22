'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    HelpCircle, 
    Book, 
    Zap, 
    Shield, 
    Wallet, 
    Video, 
    ChevronDown, 
    Search, 
    MessageCircle, 
    Activity,
    Users
} from 'lucide-react';

const FAQ_CATEGORIES = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: Book,
        color: 'from-blue-500/20 to-indigo-500/20',
        questions: [
            {
                q: 'What is Zenith?',
                a: 'Zenith is a premium, high-density video platform built for the modern creator economy. We focus on high-fidelity playback, organic-simulated growth, and multi-chain crypto integration.'
            },
            {
                q: 'How do I create an account?',
                a: 'Simply click "Sign In" at the top right. We use Privy for secure, embedded wallet creation. You can join with just an email—no seed phrases required.'
            }
        ]
    },
    {
        id: 'zenith-credits',
        title: 'Zenith Credits & Global Tips',
        icon: Zap,
        color: 'from-yellow-500/20 to-orange-500/20',
        questions: [
            {
                q: 'How do I earn Zenith Credits?',
                a: 'You earn through global tips from your fans! Fans can tip using Base (EVM) or Solana. Our smart contract splits the funds 75/25 instantly on-chain, ensuring you get paid immediately.'
            },
            {
                q: 'What is Crypto 101?',
                a: 'New to crypto? Zenith uses stablecoins like USDC for global payments. You need a wallet (MetaMask or Phantom) to receive funds. Once received, you can "Off-board" to any Centralized Exchange (CEX) like Coinbase to withdraw to your bank.'
            }
        ]
    },
    {
        id: 'creator-studio',
        title: 'Creator Studio',
        icon: Video,
        color: 'from-purple-500/20 to-pink-500/20',
        questions: [
            {
                q: 'How do I upload high-quality video?',
                a: 'Navigate to /upload. We support up to 4K resolution. Our HLS transcoding engine ensures your fans get the best bitrate for their connection.'
            },
            {
                q: 'How do I get paid?',
                a: 'Zenith uses a non-custodial 75/25 revenue split. Tips from fans go directly to your embedded Solana or Base wallet. You can set your payout addresses in Studio Settings.'
            }
        ]
    },
    {
        id: 'security-admin',
        title: 'Safety & Admin',
        icon: Shield,
        color: 'from-emerald-500/20 to-teal-500/20',
        questions: [
            {
                q: 'How do I access the Admin Panel?',
                a: 'If you have administrative rights, you can access the dashboard at /admin. You must stay logged in and verify your session for Stimulus controls.'
            },
            {
                q: 'Is my data secure?',
                a: 'Yes. We use Supabase RLS (Row Level Security) and Privy encryption. Your private keys are non-custodial and never touch our servers.'
            }
        ]
    },
    {
        id: 'crypto-offramp',
        title: 'Crypto & Off-Ramping',
        icon: Wallet,
        color: 'from-green-500/20 to-emerald-500/20',
        questions: [
            {
                q: 'How do I off-ramp my crypto earnings to cash (USD)?',
                a: 'Zenith uses non-custodial wallets (Solana/Base). To convert your earnings to cash legally and safely, you can transfer your USDC, SOL, or ETH from your embedded Privy wallet over to a centralized exchange (like Coinbase, Kraken, or Binance). From the exchange, you can sell the tokens for USD and withdraw directly to your linked bank account.'
            },
            {
                q: 'Are there taxes on crypto earnings?',
                a: 'Yes. In most jurisdictions, crypto earnings from content creation are subject to income tax. When you off-ramp or trade tokens, you may also trigger capital gains events. We recommend consulting with a certified tax professional and keeping clear records of your on-chain transactions.'
            }
        ]
    }
];

export default function HelpClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const filteredCategories = FAQ_CATEGORIES.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.questions.length > 0);

    return (
        <div className="relative w-full px-4 md:px-8 py-10 min-h-screen">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFB800]/5 blur-[120px] -z-10 pointer-events-none" />
                    
                    {/* Header */}
                    <div className="max-w-4xl mx-auto mb-16 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
                        >
                            <HelpCircle size={16} className="text-[#FFB800]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Knowledge Hub</span>
                        </motion.div>
                        
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
                            HOW CAN WE HELP?
                        </h1>
                        
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input 
                                type="text"
                                placeholder="Search the Zenith FAQ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl pl-16 pr-6 text-lg focus:outline-none focus:border-[#FFB800]/50 transition-all font-medium placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    {/* Bento Grid Categories */}
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {FAQ_CATEGORIES.map((cat, i) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => {
                                    document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className={`p-8 rounded-[40px] bg-gradient-to-br ${cat.color} border border-white/5 group hover:border-white/10 transition-all cursor-pointer`}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                                    <cat.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                                <p className="text-sm text-gray-400 font-medium">{cat.questions.length} topics</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ List */}
                    <div className="max-w-4xl mx-auto space-y-4 pb-20">
                        {filteredCategories.map((cat) => (
                            <div key={cat.id} id={`category-${cat.id}`} className="space-y-4 scroll-mt-24">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 pt-8 pb-4 border-b border-white/5 ml-4">
                                    {cat.title}
                                </h2>
                                {cat.questions.map((item, qIdx) => {
                                    const id = `${cat.id}-${qIdx}`;
                                    const isOpen = openIndex === id;
                                    
                                    return (
                                        <div 
                                            key={id} 
                                            className={`rounded-3xl border transition-all overflow-hidden ${isOpen ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 hover:bg-white/[0.02]'}`}
                                        >
                                            <button 
                                                onClick={() => setOpenIndex(isOpen ? null : id)}
                                                className="w-full px-8 py-6 flex items-center justify-between text-left"
                                            >
                                                <span className="text-lg font-bold tracking-tight">{item.q}</span>
                                                <ChevronDown 
                                                    size={20} 
                                                    className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#FFB800]' : ''}`} 
                                                />
                                            </button>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-8 pb-8 text-gray-400 font-medium leading-relaxed"
                                                    >
                                                        {item.a}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#FFB800]/10 to-orange-500/10 border border-[#FFB800]/20 rounded-[40px] p-12 text-center mb-20">
                        <Users size={48} className="text-[#FFB800] mx-auto mb-6" />
                        <h2 className="text-3xl font-black mb-4">STILL HAVE QUESTIONS?</h2>
                        <p className="text-gray-400 max-w-lg mx-auto mb-8 font-medium">Join our global community or reach out to the Vantix dev team for direct support.</p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <button title="Join Discord" className="px-8 py-4 bg-[#FFB800] text-black rounded-2xl font-black tracking-tighter hover:bg-orange-500 transition-all flex items-center gap-2">
                                <MessageCircle size={20} /> JOIN DISCORD
                            </button>
                            <button title="Platform Status" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black tracking-tighter hover:bg-white/10 transition-all flex items-center gap-2">
                                <Activity size={20} /> STATUS
                            </button>
                        </div>
                    </div>
        </div>
    );
}
