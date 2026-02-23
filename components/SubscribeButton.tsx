'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscribeButtonProps {
    channelId: string;
    channelName?: string; // Optional for optimistic UI updates or toasts
    className?: string;
    onToggle?: (isSubscribed: boolean) => void;
}

export default function SubscribeButton({ channelId, channelName, className = '', onToggle }: SubscribeButtonProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user && channelId) {
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, [user, channelId]);

    const checkSubscription = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('subscriber_id', user.id)
                .eq('channel_id', channelId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

            const subscribed = !!data;
            setIsSubscribed(subscribed);
            if (onToggle) onToggle(subscribed);

        } catch (err) {
            console.error('Error checking subscription:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent parent link clicks
        e.stopPropagation();

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.id === channelId) {
            alert("You can't subscribe to yourself!");
            return;
        }

        setProcessing(true);
        try {
            if (isSubscribed) {
                // Unsubscribe
                const { error } = await supabase
                    .from('subscriptions')
                    .delete()
                    .eq('subscriber_id', user.id)
                    .eq('channel_id', channelId);

                if (error) throw error;
                setIsSubscribed(false);
                if (onToggle) onToggle(false);
            } else {
                // Subscribe
                const { error } = await supabase
                    .from('subscriptions')
                    .insert({
                        subscriber_id: user.id,
                        channel_id: channelId
                    });

                if (error) throw error;
                setIsSubscribed(true);
                if (onToggle) onToggle(true);
            }
        } catch (err) {
            console.error('Error toggling subscription:', err);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return null; // Or a skeleton

    if (isSubscribed) {
        return (
            <button
                onClick={handleToggle}
                disabled={processing}
                className={`bg-surface hover:bg-surface-hover hover:text-destructive hover:border-destructive/30 border border-border/50 text-foreground font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${className}`}
            >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span className="group-hover:hidden">Subscribed</span>
                <span className="hidden group-hover:inline">Unsubscribe</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={processing}
            className={`btn btn-primary px-6 py-2 rounded-full font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 ${className}`}
        >
            {processing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Subscribe
        </button>
    );
}
