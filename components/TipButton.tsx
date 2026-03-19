'use client';

import React, { useState, useEffect } from 'react';
import {
    Loader2, CheckCircle2, AlertCircle, X,
    ChevronRight, Flame, Copy, ExternalLink
} from 'lucide-react';
import {
    createWalletClient, custom, parseEther, parseUnits,
    encodeFunctionData
} from 'viem';
import { base } from 'viem/chains';
import { motion, AnimatePresence } from 'framer-motion';
import * as web3 from '@solana/web3.js';
import {
    PLATFORM_WALLET_EVM,
    PLATFORM_WALLET_SOLANA,
    VIBESTREAM_SPLITTER_CONTRACT,
    TIPS_PLATFORM_FEE_PERCENT,
    TIPS_CREATOR_SHARE_PERCENT,
    USDC_BASE_ADDRESS,
    USDC_SOLANA_ADDRESS,
} from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TipButtonProps {
    creator: {
        username: string;
        wallet_address?: string;
        solana_wallet_address?: string;
    };
}

type Chain  = 'base' | 'solana';
type Asset  = 'native' | 'usdc';
type Status = 'idle' | 'loading' | 'success' | 'error';

// ─── Splitter Contract ABI (only the functions we call) ──────────────────────

const SPLITTER_ABI = [
    {
        name: 'tipETH',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{ name: 'creator', type: 'address' }],
        outputs: [],
    },
    {
        name: 'tipUSDC',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'creator',  type: 'address' },
            { name: 'amount',   type: 'uint256' },
        ],
        outputs: [],
    },
] as const;

// ERC20 approve ABI
const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount',  type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TipButton({ creator }: TipButtonProps) {
    const [isOpen, setIsOpen]               = useState(false);
    const [status, setStatus]               = useState<Status>('idle');
    const [selectedChain, setSelectedChain] = useState<Chain>(
        creator.wallet_address ? 'base' : 'solana'
    );
    const [selectedAsset, setSelectedAsset] = useState<Asset>('usdc'); // USDC default
    const [amount, setAmount]               = useState('5');
    const [error, setError]                 = useState<string | null>(null);
    const [txHash, setTxHash]               = useState<string | null>(null);

    // Auto-select chain based on what the creator has configured
    useEffect(() => {
        if (!creator.wallet_address && creator.solana_wallet_address) {
            setSelectedChain('solana');
        } else if (creator.wallet_address && !creator.solana_wallet_address) {
            setSelectedChain('base');
        }
    }, [creator]);

    const hasNoWallet = !creator.wallet_address && !creator.solana_wallet_address;

    // ─── Base (EVM) tip via VibeStreamSplitter contract ──────────────────────

    const handleBaseTip = async () => {
        const eth = (window as any).ethereum;
        if (!eth) throw new Error('No EVM wallet found. Install MetaMask or Coinbase Wallet.');

        const [account] = await eth.request({ method: 'eth_requestAccounts' });
        const walletClient = createWalletClient({
            account,
            chain: base,
            transport: custom(eth),
        });

        const creatorAddr = creator.wallet_address as `0x${string}`;
        const hasContract = !!VIBESTREAM_SPLITTER_CONTRACT;

        if (selectedAsset === 'native') {
            const totalWei = parseEther(amount);

            if (hasContract) {
                // ✅ Use on-chain splitter contract — single tx, atomic
                const hash = await (walletClient as any).writeContract({
                    address: VIBESTREAM_SPLITTER_CONTRACT as `0x${string}`,
                    abi: SPLITTER_ABI,
                    functionName: 'tipETH',
                    args: [creatorAddr],
                    value: totalWei,
                });
                setTxHash(hash);
            } else {
                // Fallback: manual split (2 txs) until contract is deployed
                const platformCut = (totalWei * BigInt(TIPS_PLATFORM_FEE_PERCENT)) / BigInt(100);
                const creatorCut  = totalWei - platformCut;

                await walletClient.sendTransaction({ account, to: creatorAddr, value: creatorCut });
                await walletClient.sendTransaction({ account, to: PLATFORM_WALLET_EVM as `0x${string}`, value: platformCut });
            }
        } else {
            // USDC: approve splitter then call tipUSDC (single tx)
            const total6 = parseUnits(amount, 6);

            if (hasContract) {
                // Step 1: Approve splitter to move USDC
                await (walletClient as any).writeContract({
                    address: USDC_BASE_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [VIBESTREAM_SPLITTER_CONTRACT as `0x${string}`, total6],
                });
                // Step 2: Call tipUSDC — contract does the split
                const hash = await (walletClient as any).writeContract({
                    address: VIBESTREAM_SPLITTER_CONTRACT as `0x${string}`,
                    abi: SPLITTER_ABI,
                    functionName: 'tipUSDC',
                    args: [creatorAddr, total6],
                });
                setTxHash(hash);
            } else {
                // Fallback manual split
                const platformCut = (total6 * BigInt(TIPS_PLATFORM_FEE_PERCENT)) / BigInt(100);
                const creatorCut  = total6 - platformCut;
                const abi = [{ name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;
                await (walletClient as any).writeContract({ address: USDC_BASE_ADDRESS as `0x${string}`, abi, functionName: 'transfer', args: [creatorAddr, creatorCut] });
                await (walletClient as any).writeContract({ address: USDC_BASE_ADDRESS as `0x${string}`, abi, functionName: 'transfer', args: [PLATFORM_WALLET_EVM as `0x${string}`, platformCut] });
            }
        }
    };

    // ─── Solana tip (atomic multi-instruction transaction) ───────────────────

    const handleSolanaTip = async () => {
        const provider = (window as any).solana ?? (window as any).phantom?.solana;
        if (!provider) throw new Error('Phantom wallet not found. Install Phantom.');

        await provider.connect();
        const connection = new web3.Connection(
            web3.clusterApiUrl('mainnet-beta'),
            'confirmed'
        );
        const publicKey: web3.PublicKey = provider.publicKey;
        const tx = new web3.Transaction();

        if (selectedAsset === 'native') {
            const totalLamports  = parseFloat(amount) * web3.LAMPORTS_PER_SOL;
            const platformLamps  = Math.floor((totalLamports * TIPS_PLATFORM_FEE_PERCENT) / 100);
            const creatorLamps   = Math.floor(totalLamports - platformLamps);

            tx.add(
                web3.SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey:   new web3.PublicKey(creator.solana_wallet_address!),
                    lamports:   creatorLamps,
                }),
                web3.SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey:   new web3.PublicKey(PLATFORM_WALLET_SOLANA),
                    lamports:   platformLamps,
                })
            );
        } else {
            // USDC (SPL Token) — atomic split
            const { getAssociatedTokenAddress, createTransferInstruction } =
                await import('@solana/spl-token');
            const mint       = new web3.PublicKey(USDC_SOLANA_ADDRESS);
            const total6     = Math.floor(parseFloat(amount) * 1_000_000);
            const platform6  = Math.floor((total6 * TIPS_PLATFORM_FEE_PERCENT) / 100);
            const creator6   = total6 - platform6;

            const [userATA, creatorATA, platformATA] = await Promise.all([
                getAssociatedTokenAddress(mint, publicKey),
                getAssociatedTokenAddress(mint, new web3.PublicKey(creator.solana_wallet_address!)),
                getAssociatedTokenAddress(mint, new web3.PublicKey(PLATFORM_WALLET_SOLANA)),
            ]);

            tx.add(
                createTransferInstruction(userATA, creatorATA,  publicKey, creator6),
                createTransferInstruction(userATA, platformATA, publicKey, platform6)
            );
        }

        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer        = publicKey;

        const signed    = await provider.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature, 'confirmed');
        setTxHash(signature);
    };

    // ─── Unified tip handler ──────────────────────────────────────────────────

    const processTip = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter an amount greater than 0.');
            return;
        }
        setStatus('loading');
        setError(null);
        setTxHash(null);
        try {
            if (selectedChain === 'base') await handleBaseTip();
            else                           await handleSolanaTip();
            setStatus('success');
            setTimeout(() => { setIsOpen(false); setStatus('idle'); }, 4000);
        } catch (err: any) {
            console.error('[TipButton] Error:', err);
            setError(err?.message || 'Transaction failed. Please try again.');
            setStatus('error');
        }
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const assetLabel   = selectedAsset === 'usdc' ? 'USDC' : selectedChain === 'base' ? 'ETH' : 'SOL';
    const explorerBase = (hash: string) =>
        selectedChain === 'base'
            ? `https://basescan.org/tx/${hash}`
            : `https://solscan.io/tx/${hash}`;

    const canSelectBase   = !!creator.wallet_address;
    const canSelectSolana = !!creator.solana_wallet_address;

    const closeModal = () => {
        if (status !== 'loading') {
            setIsOpen(false);
            setStatus('idle');
            setError(null);
            setTxHash(null);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                aria-label={`Send a tip to ${creator.username}`}
                title={`Hype ${creator.username}`}
                className="flex items-center gap-2 bg-[#FFB800] hover:bg-orange-400 text-black px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,184,0,0.3)]"
            >
                <Flame size={16} fill="currentColor" aria-hidden />
                Hype Creator
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Send tip to creator"
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            onClick={closeModal}
                            aria-hidden
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-7 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black tracking-tighter uppercase italic">
                                        Send Good Vibes
                                    </h2>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                                        Supporting {creator.username}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    aria-label="Close tip modal"
                                    title="Close"
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X size={20} aria-hidden />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-7 space-y-6">

                                {/* ── No wallet configured ── */}
                                {hasNoWallet ? (
                                    <div className="py-8 text-center space-y-3">
                                        <p className="text-zinc-400 text-sm">
                                            This creator hasn&apos;t set up a payout wallet yet.
                                        </p>
                                    </div>

                                /* ── Success ── */
                                ) : status === 'success' ? (
                                    <div className="py-10 text-center space-y-5">
                                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                                            <CheckCircle2 size={40} className="text-green-400" aria-hidden />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase italic">Vibes Sent! 🔥</h3>
                                            <p className="text-zinc-500 text-sm font-bold mt-1">
                                                {amount} {assetLabel} on {selectedChain === 'base' ? 'Base' : 'Solana'}
                                            </p>
                                            <p className="text-zinc-600 text-xs mt-1">
                                                75% to creator · 25% to platform
                                            </p>
                                        </div>
                                        {txHash && (
                                            <a
                                                href={explorerBase(txHash)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[#FFB800] text-xs font-bold hover:underline"
                                            >
                                                View on Explorer <ExternalLink size={12} aria-hidden />
                                            </a>
                                        )}
                                    </div>

                                /* ── Loading ── */
                                ) : status === 'loading' ? (
                                    <div className="py-10 text-center space-y-4">
                                        <Loader2 size={48} className="text-[#FFB800] animate-spin mx-auto" aria-label="Processing" />
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic">Processing...</h3>
                                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                                                Approve in your wallet
                                            </p>
                                        </div>
                                    </div>

                                /* ── Main form ── */
                                ) : (
                                    <>
                                        {/* Chain & Asset Selection */}
                                        <div className="space-y-4">

                                            {/* Chain */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                    Blockchain
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'base',   label: 'Base',   subtitle: 'ETH · USDC', enabled: canSelectBase,   color: 'blue' },
                                                        { id: 'solana', label: 'Solana', subtitle: 'SOL · USDC', enabled: canSelectSolana, color: 'green' },
                                                    ].map(({ id, label, subtitle, enabled, color }) => {
                                                        const isSelected = selectedChain === id;
                                                        const borderColor = color === 'blue' ? 'border-blue-500 bg-blue-500/10' : 'border-[#14F195] bg-[#14F195]/10';
                                                        return (
                                                            <button
                                                                key={id}
                                                                onClick={() => { if (enabled) setSelectedChain(id as Chain); }}
                                                                disabled={!enabled}
                                                                aria-label={`Select ${label} network${!enabled ? ' (not available)' : ''}`}
                                                                title={!enabled ? 'Creator has not configured this network' : `Pay with ${label}`}
                                                                className={`py-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1 
                                                                    ${isSelected && enabled ? borderColor : 'border-white/5 bg-black/40'}
                                                                    ${!enabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/20 cursor-pointer'}`}
                                                            >
                                                                <span className={`text-xs font-black uppercase tracking-widest ${isSelected && enabled ? (color === 'blue' ? 'text-blue-400' : 'text-[#14F195]') : 'text-zinc-500'}`}>
                                                                    {label}
                                                                </span>
                                                                <span className="text-[9px] text-zinc-600 font-bold">{subtitle}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Asset */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                    Asset
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'usdc',   label: 'USDC',                                          desc: 'Stable · Recommended' },
                                                        { id: 'native', label: selectedChain === 'base' ? 'ETH' : 'SOL', desc: 'Native token' },
                                                    ].map(({ id, label, desc }) => {
                                                        const isSelected = selectedAsset === id;
                                                        return (
                                                            <button
                                                                key={id}
                                                                onClick={() => setSelectedAsset(id as Asset)}
                                                                aria-label={`Pay with ${label}`}
                                                                className={`py-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1
                                                                    ${isSelected ? 'border-[#FFB800] bg-[#FFB800]/10' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                                                            >
                                                                <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-[#FFB800]' : 'text-zinc-500'}`}>
                                                                    {label}
                                                                </span>
                                                                <span className="text-[9px] text-zinc-600 font-bold">{desc}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                Amount ({assetLabel})
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(selectedAsset === 'usdc'
                                                    ? [{ v: '1', label: '⚡ $1' }, { v: '5', label: '🔥 $5' }, { v: '20', label: '💎 $20' }]
                                                    : selectedChain === 'base'
                                                        ? [{ v: '0.001', label: '⚡ Vibe' }, { v: '0.005', label: '🔥 Super' }, { v: '0.02', label: '💎 Mega' }]
                                                        : [{ v: '0.1', label: '⚡ Vibe' },  { v: '0.5',   label: '🔥 Super' }, { v: '2',    label: '💎 Mega' }]
                                                ).map(({ v, label }) => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setAmount(v)}
                                                        aria-label={`Set amount to ${v} ${assetLabel}`}
                                                        className={`py-3 rounded-xl border font-black text-sm transition-all
                                                            ${amount === v ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'}`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="Custom amount..."
                                                aria-label="Custom tip amount"
                                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-[#FFB800] outline-none transition-all placeholder:text-zinc-700 mt-1"
                                            />
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <div
                                                role="alert"
                                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 items-start"
                                            >
                                                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" aria-hidden />
                                                <p className="text-xs font-bold text-red-400 leading-relaxed">{error}</p>
                                            </div>
                                        )}

                                        {/* Confirm button */}
                                        <button
                                            onClick={processTip}
                                            disabled={!amount || parseFloat(amount) <= 0}
                                            aria-label={`Confirm tip of ${amount} ${assetLabel} to ${creator.username}`}
                                            className="w-full py-4 bg-[#FFB800] disabled:opacity-40 disabled:cursor-not-allowed text-black font-black rounded-full text-base uppercase tracking-widest shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            Confirm Hype
                                            <ChevronRight size={20} aria-hidden />
                                        </button>

                                        <p className="text-[9px] text-zinc-600 font-bold text-center uppercase tracking-[0.2em]">
                                            {TIPS_CREATOR_SHARE_PERCENT}% Creator · {TIPS_PLATFORM_FEE_PERCENT}% Platform · Non-Custodial
                                        </p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
