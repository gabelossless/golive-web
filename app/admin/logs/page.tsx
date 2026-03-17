import React from 'react';
import { 
    Activity, 
    Shield, 
    User, 
    Video, 
    AlertCircle, 
    CheckCircle2,
    Clock,
    Search
} from 'lucide-react';

export default function AdminLogs() {
    const logs = [
        { id: 1, type: 'SECURITY', action: 'Admin Login', user: 'daimonzachery@gmail.com', time: '2 mins ago', status: 'SUCCESS' },
        { id: 2, type: 'CONTENT', action: 'Video Deleted', user: 'lylyg82g@gmail.com', details: 'ID: vid_90210', time: '14 mins ago', status: 'SUCCESS' },
        { id: 3, type: 'USER', action: 'Account Suspended', user: 'gabelossless@gmail.com', details: 'User: spammer_01', time: '1 hour ago', status: 'WARNING' },
        { id: 4, type: 'SYSTEM', action: 'R2 Cache Cleared', user: 'System', time: '3 hours ago', status: 'SUCCESS' },
        { id: 5, type: 'SECURITY', action: 'Failed Admin Access', user: 'unknown_ip', time: '5 hours ago', status: 'CRITICAL' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Audit Trail</h2>
                    <p className="text-sm text-gray-500">Immutable record of all administrative and system events.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Filter logs..." 
                            className="bg-[#0a0a0a] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm focus:border-[#FFB800]/50 outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
                <div className="divide-y divide-white/5">
                    {logs.map((log) => (
                        <div key={log.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                            <div className="flex items-center gap-6">
                                <div className={`p-3 rounded-2xl ${
                                    log.status === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 
                                    log.status === 'WARNING' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 
                                    'bg-green-500/10 text-green-500'
                                }`}>
                                    {log.type === 'SECURITY' ? <Shield size={20} /> : 
                                     log.type === 'CONTENT' ? <Video size={20} /> : 
                                     log.type === 'USER' ? <User size={20} /> : 
                                     <Activity size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-sm tracking-tight">{log.action}</h4>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                                            log.status === 'CRITICAL' ? 'bg-red-500 text-white' : 
                                            'bg-white/5 text-gray-400'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        <span className="text-gray-400 font-medium">{log.user}</span>
                                        {log.details && ` • ${log.details}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 font-bold uppercase tracking-widest">
                                <Clock size={12} />
                                {log.time}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                    <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#FFB800] transition-colors">Load Older Entries</button>
                </div>
            </div>
        </div>
    );
}
