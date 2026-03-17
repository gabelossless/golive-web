'use client';

import { supabase } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function AdminToggle({ profileId, initialIsAdmin }: { profileId: string, initialIsAdmin: boolean }) {
    const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
    const [loading, setLoading] = useState(false);

    const toggleAdmin = async () => {
        if (!confirm(`Are you sure you want to ${isAdmin ? 'remove' : 'grant'} admin powers for this user?`)) return;
        
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: !isAdmin })
                .eq('id', profileId);
            
            if (error) throw error;
            setIsAdmin(!isAdmin);
        } catch (e: any) {
            alert('Error updating admin status: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={toggleAdmin}
            disabled={loading}
            className={`p-2 rounded-lg transition-all ${isAdmin ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-[#FFB800]/10 text-[#FFB800] hover:bg-[#FFB800]/20'}`}
            title={isAdmin ? 'Remove Admin' : 'Grant Admin'}
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : isAdmin ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
        </button>
    );
}
