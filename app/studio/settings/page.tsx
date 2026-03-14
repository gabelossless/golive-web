'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, AtSign, Tv, Save, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          display_name: profile.display_name,
          channel_name: profile.channel_name,
          bio: profile.bio,
        })
        .eq('id', user?.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#FFB800]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-12">
        <h1 className="text-3xl font-black font-display tracking-tight mb-2">CHANNEL SETTINGS</h1>
        <p className="text-gray-500 font-medium tracking-tight">Customize how your vibe looks to others.</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Identity Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FFB800] mb-4">Identity</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Handle (@username)</label>
              <div className="relative group">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" size={18} />
                <input 
                  type="text"
                  value={profile.username || ''}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFB800]/50 transition-all font-bold text-sm"
                  placeholder="vibecode"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Display Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" size={18} />
                <input 
                  type="text"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFB800]/50 transition-all font-bold text-sm"
                  placeholder="Vibe Master"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Channel Name</label>
              <div className="relative group">
                <Tv className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFB800] transition-colors" size={18} />
                <input 
                  type="text"
                  value={profile.channel_name || ''}
                  onChange={(e) => setProfile({ ...profile, channel_name: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#FFB800]/50 transition-all font-bold text-sm"
                  placeholder="Official Vibe TV"
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FFB800] mb-4">About</h3>
            
            <div className="space-y-2 h-full flex flex-col">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Bio</label>
              <textarea 
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 outline-none focus:border-[#FFB800]/50 transition-all font-bold text-sm resize-none flex-1 min-h-[220px]"
                placeholder="Tell the world about your vibe..."
              />
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </motion.div>
        )}

        <div className="pt-8 flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="px-8 py-4 rounded-2xl bg-[#FFB800] hover:bg-[#FFD700] text-black font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(255,184,0,0.15)] disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </form>
    </div>
  );
}
