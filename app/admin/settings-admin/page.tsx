import React from 'react';
import { 
    Settings as SettingsIcon, 
    Monitor, 
    Cloud, 
    Shield, 
    Zap, 
    Bell,
    Lock,
    Save
} from 'lucide-react';

export default function AdminSettings() {
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase">Platform Settings</h2>
                <p className="text-sm text-gray-500">Configure global parameters and feature flags.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Configuration */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 space-y-8">
                    <h3 className="text-lg font-black tracking-tighter uppercase mb-2 flex items-center gap-2">
                        <Monitor size={20} className="text-[#FFB800]" />
                        System Toggles
                    </h3>
                    
                    <div className="space-y-6">
                        <ToggleItem 
                            label="Maintenance Mode" 
                            description="Disable all public-facing routes and show maintenance page." 
                            enabled={false}
                        />
                        <ToggleItem 
                            label="Public Signups" 
                            description="Allow new users to create accounts." 
                            enabled={true}
                        />
                        <ToggleItem 
                            label="Community Seeding" 
                            description="Enable algorithmic engagement for new uploads." 
                            enabled={true}
                        />
                    </div>
                </div>

                {/* Content Controls */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 space-y-8">
                    <h3 className="text-lg font-black tracking-tighter uppercase mb-2 flex items-center gap-2">
                        <Zap size={20} className="text-purple-500" />
                        Infrastructure
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold">Base CDN Region</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Global Edge</p>
                            </div>
                            <span className="text-xs font-bold text-[#FFB800]">us-east-1</span>
                        </div>

                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold">Quality Preset</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Transcoding Level</p>
                            </div>
                            <span className="text-xs font-bold text-blue-500">Ultra-High</span>
                        </div>
                    </div>
                    
                    <button className="w-full py-4 rounded-2xl bg-[#FFB800] text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, description, enabled }: { label: string, description: string, enabled: boolean }) {
    return (
        <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
                <p className="font-bold text-sm">{label}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">{description}</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${enabled ? 'bg-[#FFB800]' : 'bg-gray-800'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
        </div>
    );
}
