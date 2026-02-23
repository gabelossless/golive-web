export interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name?: string;
    bio?: string;
    created_at?: string;
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
