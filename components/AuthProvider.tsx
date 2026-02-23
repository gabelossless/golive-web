'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Profile } from '@/types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchOrCreateProfile = async (currentUser: User) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (data) {
                setProfile(data);
            } else {
                // Profile doesn't exist, create it (Auto-fix)
                console.log('Profile missing, creating default profile...');
                const username = currentUser.user_metadata?.username ||
                    currentUser.email?.split('@')[0] ||
                    `user_${currentUser.id.slice(0, 8)}`;

                const newProfile: Partial<Profile> = {
                    id: currentUser.id,
                    username: username, // Potential collision risk handled by DB constraint? Ideally needs retry logic.
                    avatar_url: currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                    full_name: currentUser.user_metadata?.full_name || '',
                };

                const { data: createdProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                    .select()
                    .single();

                if (createError) {
                    // fall back to purely random username if collision
                    if (createError.code === '23505') { // unique violation
                        const randomName = `user_${Math.random().toString(36).slice(2, 7)}`;
                        const retryProfile = { ...newProfile, username: randomName };
                        const { data: retryData } = await supabase.from('profiles').insert(retryProfile).select().single();
                        setProfile(retryData);
                    } else {
                        console.error('Error creating profile:', JSON.stringify(createError, null, 2));
                    }
                } else {
                    setProfile(createdProfile);
                }
            }
        } catch (err) {
            console.error('Error in profile fetch:', err);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                fetchOrCreateProfile(currentUser);
            }
            setIsLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsLoading(false);

            if (currentUser) {
                fetchOrCreateProfile(currentUser);
            } else {
                setProfile(null);
            }

            if (_event === 'SIGNED_OUT') {
                router.push('/login');
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
