export interface Video {
    id: string;
    title: string;
    thumbnail: string;
    author: string;
    authorAvatar: string;
    views: string;
    timestamp: string;
    duration?: string;
    isVerified?: boolean;
    isLive?: boolean;
    category: string;
}

export const categories = ['All', 'FPS', 'RPG', 'Speedruns', 'Indie', 'Strategy', 'MOBA', 'Horror', 'Simulator'];

export const mockVideos: Video[] = [
    {
        id: '1',
        title: 'INSANE Clutch in the Grand Finals! | Pro League Highlights',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop',
        author: 'FragMaster Pro',
        authorAvatar: 'https://i.pravatar.cc/150?u=frag',
        views: '1.2M',
        timestamp: '2 hours ago',
        duration: '12:34',
        isVerified: true,
        category: 'FPS'
    },
    {
        id: '2',
        title: 'Top 10 Secret Bosses You Missed in Dark Souls 4',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2670&auto=format&fit=crop',
        author: 'Lore Hunter',
        authorAvatar: 'https://i.pravatar.cc/150?u=lore',
        views: '850K',
        timestamp: '5 hours ago',
        duration: '21:07',
        category: 'RPG'
    },
    {
        id: 'live1',
        title: '🔴 24H STREAM! Road to Global Elite | Competitive CS2',
        thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2665&auto=format&fit=crop',
        author: 'NightOwlGaming',
        authorAvatar: 'https://i.pravatar.cc/150?u=night',
        views: '4.2K',
        timestamp: 'LIVE',
        isLive: true,
        category: 'FPS'
    },
    {
        id: '3',
        title: 'Stardew Valley 1.7 Update Review - Is it worth playing?',
        thumbnail: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2670&auto=format&fit=crop',
        author: 'CozyGamer',
        authorAvatar: 'https://i.pravatar.cc/150?u=cozy',
        views: '500K',
        timestamp: '1 day ago',
        duration: '15:20',
        category: 'Indie'
    },
    {
        id: '4',
        title: 'Minecraft Speedrun World Record (Any%) 1.21',
        thumbnail: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?q=80&w=2670&auto=format&fit=crop',
        author: 'BlockRunner',
        authorAvatar: 'https://i.pravatar.cc/150?u=block',
        views: '2.1M',
        timestamp: '3 days ago',
        duration: '9:58',
        category: 'Speedruns'
    },
    {
        id: '5',
        title: 'League of Legends: New Champion Gameplay Reveal',
        thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=2670&auto=format&fit=crop',
        author: 'Riot Games',
        authorAvatar: 'https://i.pravatar.cc/150?u=riot',
        views: '5.5M',
        timestamp: '3 hours ago',
        duration: '4:20',
        isVerified: true,
        category: 'MOBA'
    },
    {
        id: '6',
        title: 'Silent Hill 2 Remake - Full Walkthrough Part 1',
        thumbnail: 'https://images.unsplash.com/photo-1605898399783-1820b735e127?q=80&w=2574&auto=format&fit=crop',
        author: 'ScarryHours',
        authorAvatar: 'https://i.pravatar.cc/150?u=scary',
        views: '300K',
        timestamp: '12 hours ago',
        duration: '45:00',
        category: 'Horror'
    },
    {
        id: '7',
        title: 'Civilization VII: Early Access Gameplay',
        thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2670&auto=format&fit=crop',
        author: 'StrategyMaster',
        authorAvatar: 'https://i.pravatar.cc/150?u=strat',
        views: '80K',
        timestamp: '1 day ago',
        duration: '32:15',
        category: 'Strategy'
    }
];
