'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, AtSign, Tv, Save, Loader2, CheckCircle2, AlertCircle, FileText, Camera, Image as ImageIcon } from 'lucide-react';
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setSaving(true);
    try {
      // 1. Upload to storage
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // 3. Update profile state and DB
      const updateData = type === 'avatar' ? { avatar_url: publicUrl } : { banner_url: publicUrl };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, ...updateData });
      setMessage({ type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} updated!` });
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      setMessage({ type: 'error', text: `Failed to upload ${type}.` });
    } finally {
      setSaving(false);
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
          channel_color: profile.channel_color || '#FFB800',
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

          {/* Visuals Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FFB800] mb-4">Branding</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Avatar / Picture</label>
                <div className="flex items-center gap-6 bg-[#121212] p-6 rounded-3xl border border-white/5">
                  <div className="relative group shrink-0">
                    <img 
                      src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/5 shadow-2xl"
                      alt="Avatar"
                    />
                    <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Camera className="text-white" size={24} />
                      <input type="file" className="hidden" accept="image/*" title="Upload Avatar" onChange={(e) => handleImageUpload(e, 'avatar')} />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Creator Profile Picture</p>
                    <p className="text-xs text-gray-500">Square images work best. Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Channel Banner</label>
                <div className="relative group w-full h-32 rounded-3xl overflow-hidden border border-white/5 bg-[#121212]">
                  {profile.banner_url ? (
                    <img src={profile.banner_url} className="w-full h-full object-cover" alt="Banner" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gradient-to-br from-[#121212] to-[#1a1a1a]">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity gap-2">
                    <ImageIcon className="text-white" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Upload Banner</span>
                    <input type="file" className="hidden" accept="image/*" title="Upload Banner" onChange={(e) => handleImageUpload(e, 'banner')} />
                  </label>
                </div>
                <p className="text-[10px] text-gray-600 pl-1 uppercase font-bold tracking-tighter">Recommended: 1500 x 500 pixels</p>
              </div>

              {/* Channel Color */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Accent Vibe Color</label>
                <div className="flex items-center gap-4 bg-[#121212] p-4 rounded-2xl border border-white/5">
                  <input 
                    type="color" 
                    title="Choose Accent Vibe Color"
                    value={profile.channel_color || '#FFB800'}
                    onChange={(e) => setProfile({ ...profile, channel_color: e.target.value })}
                    className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer p-0 overflow-hidden"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold uppercase tracking-widest">Brand Mark</p>
                    <p className="text-[10px] text-gray-500 font-mono">{profile.channel_color || '#FFB800'}</p>
                  </div>
                </div>
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
                className="w-full bg-[#121212] border border-white/5 rounded-2xl p-4 outline-none focus:border-[#FFB800]/50 transition-all font-bold text-sm resize-none flex-1 min-h-[180px]"
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
