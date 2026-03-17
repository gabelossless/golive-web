import React from 'react';
import { createClient } from '@/lib/supabase-server';
import { 
    Search, 
    MoreVertical, 
    Shield, 
    UserX, 
    Mail, 
    Calendar,
    Crown,
    ShieldCheck
} from 'lucide-react';
import AdminToggle from './AdminToggle';

export default async function AdminUsers() {
    const supabase = await createClient();

    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">User Management</h2>
                    <p className="text-sm text-gray-500">Monitor and manage all platform accounts.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="bg-[#0a0a0a] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm focus:border-[#FFB800]/50 outline-none w-64"
                    />
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">User</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Role</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users?.map((profile) => (
                            <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <Shield className="text-gray-600" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm flex items-center gap-2">
                                                {profile.username}
                                                {profile.is_admin && <Crown size={12} className="text-[#FFB800]" fill="currentColor" />}
                                            </div>
                                            <p className="text-xs text-gray-500">{profile.display_name || 'No display name'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${profile.subscription_tier === 'premium' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'bg-gray-500/10 text-gray-400'}`}>
                                        {profile.subscription_tier?.toUpperCase() || 'FREE'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-[10px] font-bold ${profile.is_admin ? 'text-red-500' : 'text-gray-500'}`}>
                                        {profile.is_admin ? 'ADMINISTRATOR' : 'USER'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar size={14} />
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <AdminToggle profileId={profile.id} initialIsAdmin={profile.is_admin} />
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400" title="Contact User" aria-label="Contact User">
                                            <Mail size={18} />
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400" title="More Options" aria-label="More Options">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
