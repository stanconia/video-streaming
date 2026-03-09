export interface Room {
  id: string;
  name: string;
  broadcasterId?: string;
  createdAt: string;
  active: boolean;
}

export interface Participant {
  id: string;
  userId: string;
  role: 'BROADCASTER' | 'VIEWER';
  joinedAt: string;
}
