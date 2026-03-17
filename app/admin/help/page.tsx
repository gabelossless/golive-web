import React from 'react';
import { 
    BookOpen, 
    Shield, 
    Zap, 
    Database, 
    Globe, 
    HelpCircle,
    Key,
    UserPlus,
    Terminal,
    AlertTriangle,
    ShieldCheck
} from 'lucide-react';

export default function AdminHelp() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <header>
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Help Center & Docs</h1>
                <p className="text-gray-500 text-lg">Platform architecture, security protocols, and operator guides.</p>
            </header>

            <section className="space-y-6">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                    <Shield className="text-[#FFB800]" />
                    Administrative Security
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DocCard 
                        icon={Key}
                        title="Service Role Key"
                        description="High-privilege 'superuser' key required for migrations. Store in SUPABASE_SERVICE_ROLE_KEY environment variable. Never expose on the client."
                    />
                    <DocCard 
                        icon={UserPlus}
                        title="Promoting Admins"
                        description="Use the 'set-admin.ts' script or the Table Editor to toggle 'is_admin' in the profiles table. Admins bypass all RLS content restrictions."
                    />
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                    <Database size={24} className="text-[#FFB800]" />
                    Platform Infrastructure
                </h2>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Zap size={18} className="text-[#FFB800]" />
                            The VibeStream Stack
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            VibeStream is built on **Next.js 15+ (App Router)** for the frontend/API, **Supabase** for Auth, DB, and Realtime, and **Cloudflare R2** for hyper-scalable media delivery.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800]">Database</p>
                            <p className="text-xs text-gray-500">PostgreSQL + PostgREST via Supabase.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800]">Storage</p>
                            <p className="text-xs text-gray-500">Cloudflare R2 (S3 Compatible) + Supabase Buckets (Fallback).</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800]">Compute</p>
                            <p className="text-xs text-gray-500">Vercel Edge Functions & Serverless API Routes.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                    <Terminal size={24} className="text-[#FFB800]" />
                    Developer Operations
                </h2>
                <div className="space-y-4">
                    <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-gray-400">
                            <Database size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">Running Migrations</h4>
                            <p className="text-xs text-gray-500 leading-relaxed mb-3">To update the database schema without using the Supabase Dashboard, use the provided script:</p>
                            <code className="bg-black/50 px-3 py-1.5 rounded-lg text-xs text-[#FFB800] border border-white/5">npx ts-node scripts/migrate.ts</code>
                        </div>
                    </div>

                    <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl flex items-start gap-4">
                        <div className="p-3 bg-red-500/5 rounded-xl text-red-500">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">Emergency Lockdown</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">If malicious activity is detected, use the **Settings** panel to trigger Maintenance Mode or restrict upload permissions globally.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                    <ShieldCheck size={24} className="text-[#FFB800]" />
                    Admin Operations Guide
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-gradient-to-br from-[#0a0a0a] to-[#121212] border border-[#FFB800]/10 rounded-[40px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Zap size={80} />
                        </div>
                        <h3 className="font-bold text-lg mb-4 text-[#FFB800]">Admin Stimulus System</h3>
                        <p className="text-sm text-gray-400 leading-relaxed space-y-3">
                            For high-profile showcases, use the Stimulus Panel to manually override engagement:
                            <br /><br />
                            • **Injections**: Instantly inject views/likes into any ID.
                            <br />
                            • **Growth Engine**: Gaussian distribution for organic discovery simulation.
                        </p>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-[#0a0a0a] to-[#121212] border border-blue-500/10 rounded-[40px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Database size={80} />
                        </div>
                        <h3 className="font-bold text-lg mb-4 text-blue-500">Video Storage & Fallbacks</h3>
                        <p className="text-sm text-gray-400 leading-relaxed space-y-3">
                            Managing high-res content and 404 resilience:
                            <br /><br />
                            • **Premium Fallback**: Premium users ($10/mo) automatically upload to Supabase Buckets if R2 latency is high.
                            <br />
                            • **Diagnostic Mode**: Append `?diag=true` to watch URLs for deep access audits.
                        </p>
                    </div>
                </div>
            </section>

            <footer className="pt-10 border-t border-white/5 text-center">
                <p className="text-gray-600 text-xs">VibeStream Admin Intelligence Suite • VS-ADMIN-DOC-02 • Genesis Build</p>
            </footer>
        </div>
    );
}

function DocCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] hover:border-[#FFB800]/20 transition-all group">
            <div className="p-4 bg-white/5 rounded-2xl w-fit mb-6 text-gray-400 group-hover:text-[#FFB800] group-hover:scale-110 transition-all">
                <Icon size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
    );
}
