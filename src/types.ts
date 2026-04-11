export interface Participant {
  id: number;
  battleId: number;
  name: string;
  headline: string;
  avatarUrl: string | null;
  color: string;
  position: number;
  votes: number;
  percentage: number;
}

export interface Battle {
  id: number;
  code: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "closed";
  durationMinutes: number | null;
  activatedAt: string | null;
  expiresAt?: string | null;
  createdAt: string;
  participants?: Participant[];
  totalVotes?: number;
}

export interface VoteUpdate {
  type: "vote_update";
  participants: Participant[];
  totalVotes: number;
}
