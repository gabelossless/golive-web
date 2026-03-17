'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, AtSign, Tv, Save, Loader2, CheckCircle2, AlertCircle, FileText, Camera, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'privacy'>('profile');
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
    <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-10 pb-40">
      {/* Header with Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">STUDIO CONFIG</h1>
          <p className="text-gray-500 font-medium text-lg">Architect your channel's identity and discovery meta.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button onClick={() => setActiveTab('profile')} className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'profile' ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20" : "text-gray-400 hover:text-white")}>Profile</button>
          <button onClick={() => setActiveTab('account')} className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'account' ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20" : "text-gray-400 hover:text-white")}>Account</button>
          <button onClick={() => setActiveTab('privacy')} className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'privacy' ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20" : "text-gray-400 hover:text-white")}>Privacy</button>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Core Identity */}
        <div className="lg:col-span-8 space-y-10">
          {/* Identity Bento */}
          <section className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#FFB800] mb-8 flex items-center gap-2">
                <div className="w-1 h-4 bg-[#FFB800] rounded-full" />
                Core Identity
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] pl-1">Handle</label>
                  <div className="relative group/input">
                    <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/input:text-[#FFB800] transition-colors" size={20} />
                    <input 
                      type="text"
                      value={profile.username || ''}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-[#FFB800]/50 focus:bg-black/60 transition-all font-bold text-base placeholder-gray-800"
                      placeholder="vibecode"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] pl-1">Display Name</label>
                  <div className="relative group/input">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/input:text-[#FFB800] transition-colors" size={20} />
                    <input 
                      type="text"
                      value={profile.display_name || ''}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-[#FFB800]/50 focus:bg-black/60 transition-all font-bold text-base placeholder-gray-800"
                      placeholder="Vibe Master"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] pl-1">Channel Narrative (Bio)</label>
                  <textarea 
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 outline-none focus:border-[#FFB800]/50 focus:bg-black/60 transition-all font-bold text-base placeholder-gray-800 resize-none h-40"
                    placeholder="Tell the world about your unique vibe and content strategy..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Branding Bento */}
          <section className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#FFB800] mb-8 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#FFB800] rounded-full" />
              Ecosystem Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Profile Pic Card */}
              <div className="md:col-span-5 bg-black/40 border border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center group/avatar">
                <div className="relative mb-6">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                    className="w-32 h-32 rounded-full object-cover border-[6px] border-[#FFB800]/20 shadow-2xl relative z-10"
                    alt="Avatar"
                  />
                  <label className="absolute inset-0 bg-black/80 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-all z-20 backdrop-blur-sm border-[6px] border-white/10">
                    <Camera className="text-white" size={32} />
                    <input type="file" className="hidden" accept="image/*" title="Upload Avatar" onChange={(e) => handleImageUpload(e, 'avatar')} />
                  </label>
                  <div className="absolute inset-0 rounded-full bg-[#FFB800]/20 blur-2xl animate-pulse scale-90" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-1">Avatar</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Square Assets preferred</p>
              </div>

              {/* Banner / Color Card */}
              <div className="md:col-span-7 space-y-6">
                <div className="relative group/banner w-full h-44 rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                  {profile.banner_url ? (
                    <img src={profile.banner_url} className="w-full h-full object-cover" alt="Banner" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-800 bg-gradient-to-br from-black/0 to-white/[0.02]">
                      <ImageIcon size={48} className="opacity-20 mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">No Banner Set</p>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/80 opacity-0 group-hover/banner:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all backdrop-blur-md gap-3">
                    <div className="bg-white/10 p-4 rounded-2xl">
                      <ImageIcon className="text-white" size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Update Cinematic Banner</span>
                    <input type="file" className="hidden" accept="image/*" title="Upload Banner" onChange={(e) => handleImageUpload(e, 'banner')} />
                  </label>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/color">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl border border-white/10 shadow-lg relative overflow-hidden cursor-pointer"
                      style={{ backgroundColor: profile.channel_color || '#FFB800' }}
                    >
                      <input 
                        type="color" 
                        title="Choose Accent Vibe Color"
                        value={profile.channel_color || '#FFB800'}
                        onChange={(e) => setProfile({ ...profile, channel_color: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer scale-[5]"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">Brand Mark</p>
                      <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{profile.channel_color || '#FFB800'}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center text-gray-700">#</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Meta & Actions */}
        <div className="lg:col-span-4 space-y-10">
          {/* Recommendation Meta */}
          <section className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#FFB800] mb-8">Recommendation Meta</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Primary Category</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 outline-none focus:border-[#FFB800]/50 transition-all font-black text-xs uppercase cursor-pointer appearance-none"
                  value={profile.channel_name ? (profile.channel_name.includes('|') ? profile.channel_name.split('|')[1].trim() : '') : ''}
                  onChange={(e) => {
                    const baseName = profile.channel_name?.split('|')[0].trim() || profile.username;
                    setProfile({ ...profile, channel_name: `${baseName} | ${e.target.value}` });
                  }}
                  title="Choose Primary Creator Category"
                >
                  <option value="">Uncategorized</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
                  <option value="Music">Music</option>
                  <option value="Tech & Hardware">Tech & Hardware</option>
                  <option value="Life & Vibes">Life & Vibes</option>
                </select>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter italic">This powers your placement in global trending feeds.</p>
              </div>

              <div className="p-5 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-2xl relative group">
                <div className="absolute top-0 right-0 p-3 opacity-20"><FileText size={16} /></div>
                <h5 className="text-[10px] font-black uppercase text-[#FFB800] mb-2 tracking-widest">Discovery Tip</h5>
                <p className="text-[10px] text-[#FFB800] opacity-80 leading-relaxed font-medium">Verified creators with complete meta profiles see 40% more organic reach.</p>
              </div>
            </div>
          </section>

          {/* Action Hub */}
          <div className="space-y-4">
            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("p-5 rounded-[1.5rem] flex items-center gap-4 font-black text-xs uppercase tracking-widest",
                  message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                )}
              >
                {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                {message.text}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={saving}
              className="w-full py-6 rounded-[2rem] bg-[#FFB800] hover:bg-[#FFD700] text-black font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,184,0,0.15)] disabled:opacity-50 group active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-125 transition-transform" />}
              {saving ? 'SYNCING...' : 'FINALIZE CONFIG'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
