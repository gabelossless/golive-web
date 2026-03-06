export interface User {
  id: string;
  name: string;
  avatar: string;
  isLive?: boolean;
  followers?: number;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadedAt: string;
  creator: User;
  isLive?: boolean;
  category?: string;
  description?: string;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  text: string;
  user: User;
  timestamp: string;
}

export interface Comment {
  id: string;
  text: string;
  user: User;
  timestamp: string;
  likes: number;
}
