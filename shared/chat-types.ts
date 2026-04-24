export interface Member {
  id: string;
  username: string;
  avatarUrl?: string;
  roles?: string[];
}

export interface Reaction {
  emoji: string;
  count: number;
  byUser?: boolean;
}

export interface Reply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: Member;
  content: string;
  createdAt: string;
  editedAt?: string;
  reactions?: Reaction[];
  replies?: Reply[];
  typing?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  category?: string;
  unreadCount?: number;
  muted?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
}
