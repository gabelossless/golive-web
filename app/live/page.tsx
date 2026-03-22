export const metadata = {
    title: 'Live — Zenith',
    description: 'Livestreaming coming soon to Zenith.',
};

export default function LivePage() {
    return (
        <div className="min-h-screen bg-black text-white px-4 flex items-center justify-center">
            <div className="max-w-2xl w-full text-center space-y-8">
                <div className="inline-flex items-center justify-center p-4 bg-zinc-900 rounded-full mb-4">
                    <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-white mb-6">
                    Live <span className="text-[#FFB800]">Coming Soon</span>
                </h1>
                
                <p className="text-zinc-400 text-xl md:text-2xl leading-relaxed max-w-xl mx-auto">
                    We're building the ultimate high-fidelity livestreaming experience for Zenith.
                </p>
                
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mt-12 backdrop-blur-sm">
                    <h2 className="text-xl font-bold uppercase tracking-wide text-white mb-4">
                        Infrastructure Status
                    </h2>
                    <p className="text-zinc-400">
                        Currently optimizing global edge nodes to support 10,000+ concurrent viewers with a projected infrastructure cost of $0-$10 monthly per creator.
                    </p>
                </div>
            </div>
        </div>
    );
}
