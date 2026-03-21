export interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    bio?: string;
    created_at?: string;
    is_verified?: boolean;
    is_premium?: boolean;
    is_admin?: boolean;
    banner_url?: string;
    social_links?: any;
    is_monetized?: boolean;
    target_subs?: number;
    channel_color?: string;
    subscription_tier?: 'free' | 'premium';
    display_name?: string;
    channel_name?: string;
    follower_count?: number;
    wallet_address?: string;
    solana_wallet_address?: string;
}

export interface Video {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    video_url: string;
    thumbnail_url: string | null;
    view_count: number;
    created_at: string;
    category?: string;
    is_live?: boolean;
    profiles?: Profile; // Joined data often comes as 'profiles'
    target_likes?: number; // Growth hacking: specific target
    target_views?: number; // Growth hacking
    boosted?: boolean;
    width?: number;
    height?: number;
    bitrate?: number;
    quality_score?: number;
    allow_clipping?: boolean;
    allow_comments?: boolean;
    visibility?: string;
    scheduled_for?: string | null;
    license?: string;
    hype_count?: number;
    likes_count?: number;
    is_short?: boolean;
    playback_id?: string;
    is_decentralized?: boolean;
}

export interface Comment {
    id: string;
    video_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: Profile;
}

export interface Like {
    id: string;
    video_id: string;
    user_id: string;
    created_at?: string;
}

export interface Subscription {
    id: string;
    subscriber_id: string;
    channel_id: string;
    created_at?: string;
}
