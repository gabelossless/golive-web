'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, CheckCircle2, Zap, Rocket, Shield, Crown } from 'lucide-react';
import Link from 'next/link';

const BENEFITS = [
  { icon: Crown, title: "Verified Badge", desc: "Get that golden checkmark on your profile and every comment." },
  { icon: Shield, title: "Premium Storage", desc: "Resilient high-speed storage backup for all your high-res uploads." },
  { icon: Zap, title: "Priority Support", desc: "Direct line to our creator success team 24/7." },
  { icon: Rocket, title: "Early Access", desc: "Test new feature drops (like AI Studio V2) before anyone else." },
];

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    // Simulate payment flow
    setTimeout(() => {
      alert('Welcome to the Elite! (Simulated premium activation)');
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFB800]/5 rounded-full blur-[100px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-600/5 rounded-full blur-[80px] -ml-32 -mb-32" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-xs font-black uppercase tracking-widest"
          >
            <Zap size={14} fill="currentColor" /> Premium Experience
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black font-display tracking-tight"
          >
            JOIN THE <span className="text-[#FFB800]">ELITE</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto font-medium"
          >
            Level up your creator journey with verification, premium storage, and exclusive creator perks for just $10/month.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Benefits List */}
          <div className="space-y-8">
            {BENEFITS.map((benefit, i) => (
              <motion.div 
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="flex gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#FFB800]/10 group-hover:border-[#FFB800]/30 transition-all">
                  <benefit.icon className="text-[#FFB800]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500 font-medium">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pricing Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-[#121212] border border-white/5 rounded-[40px] p-8 md:p-12 relative shadow-2xl overflow-hidden group"
          >
            {/* Glossy Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black font-display mb-2">VIBE PREMIER</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Unlimited Creator Potential</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFB800] text-black">
                  <Crown size={24} />
                </div>
              </div>

              <div className="mb-8">
                <span className="text-6xl font-black font-display">$10</span>
                <span className="text-gray-500 font-bold ml-2">/ month</span>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-sm font-bold">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  Golden Verified Badge
                </div>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  4K High-Res Storage Fallback
                </div>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  Advanced Analytics Dashboard
                </div>
              </div>

              <button 
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full py-5 rounded-2xl bg-[#FFB800] hover:bg-[#FFD700] text-black font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,184,0,0.2)]"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Upgrade Now <Zap size={18} fill="currentColor" /></>
                )}
              </button>
              
              <p className="text-center text-[10px] text-gray-600 mt-6 font-bold uppercase tracking-widest">
                Cancel anytime. Secure Checkout.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
