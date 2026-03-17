import React from 'react';
import { 
    TrendingUp, 
    Users, 
    Video, 
    Eye, 
    ArrowUpRight, 
    ArrowDownRight,
    Globe,
    Smartphone,
    Monitor
} from 'lucide-react';

export default function AdminAnalytics() {
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase">Platform Intelligence</h2>
                <p className="text-sm text-gray-500">In-depth analysis of user engagement and content performance.</p>
            </div>

            {/* Engagement Charts / Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="font-bold">Audience Retention</h3>
                            <p className="text-xs text-gray-500">Average watch time per session over 30 days.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-[#FFB800] text-black text-[10px] font-black rounded-full">30D</span>
                            <span className="px-3 py-1 bg-white/5 text-gray-400 text-[10px] font-black rounded-full">90D</span>
                        </div>
                    </div>
                    
                    {/* Mock Chart Visualization */}
                    <div className="h-64 flex items-end gap-1 px-4">
                        {[40, 65, 30, 85, 45, 90, 70, 55, 80, 40, 60, 95, 30, 50, 70, 85, 40, 60, 90].map((h, i) => (
                            <div 
                                key={i} 
                                className="flex-1 bg-gradient-to-t from-[#FFB800] to-orange-500 rounded-t-lg transition-all hover:scale-110 cursor-pointer" 
                                style={{ height: `${h}%`, opacity: 0.3 + (h/100) }}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <span>Mar 01</span>
                        <span>Mar 15</span>
                        <span>Mar 17</span>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 space-y-8">
                    <h3 className="font-bold">Device Distribution</h3>
                    <div className="space-y-6">
                        <DeviceStat icon={Smartphone} label="Mobile" percentage={78} />
                        <DeviceStat icon={Monitor} label="Desktop" percentage={18} />
                        <DeviceStat icon={Globe} label="Other" percentage={4} />
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#FFB800] mb-4">Engagement Surge</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Mobile traffic has increased by <span className="text-white font-bold">24%</span> following the PWA optimization in Phase 5.
                        </p>
                    </div>
                </div>
            </div>

            {/* Additional Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SmallMetricCard label="Avg. Session" value="12.4m" trend="+2m" up={true} />
                <SmallMetricCard label="Bounce Rate" value="32.1%" trend="-4%" up={true} />
                <SmallMetricCard label="Ad Revenue (Est)" value="$14,204" trend="+$1.2k" up={true} />
            </div>
        </div>
    );
}

function DeviceStat({ icon: Icon, label, percentage }: { icon: any, label: string, percentage: number }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2 text-gray-400">
                    <Icon size={14} />
                    {label}
                </span>
                <span>{percentage}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${percentage}%` }} 
                />
            </div>
        </div>
    );
}

function SmallMetricCard({ label, value, trend, up }: { label: string, value: string, trend: string, up: boolean }) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex justify-between items-center">
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-xl font-black">{value}</h3>
            </div>
            <div className={`text-[10px] font-black flex items-center gap-1 ${up ? 'text-green-500' : 'text-red-500'}`}>
                {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trend}
            </div>
        </div>
    );
}
