import { supabase } from '@/lib/supabase';
import { Metadata, ResolvingMetadata } from 'next';
import ProfileClient from './ProfileClient';

type Props = {
    params: Promise<{ username: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', decodedUsername)
        .single();

    if (!profile) {
        return {
            title: 'Channel Not Found - Zenith'
        }
    }

    const title = profile.display_name || profile.channel_name || profile.username;
    const description = profile.bio || `Check out ${title}'s channel on VibeStream`;
    const defaultImage = 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=1200&q=80';

    return {
        title: `${title} - VibeStream`,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [
                {
                    url: profile.avatar_url || defaultImage,
                    width: 800,
                    height: 800,
                    alt: title,
                },
            ],
            type: 'profile',
        },
        twitter: {
            card: 'summary',
            title: title,
            description: description,
            images: [profile.avatar_url || defaultImage],
        },
    }
}

export default async function ProfilePage({ params }: Props) {
    return <ProfileClient />;
}
