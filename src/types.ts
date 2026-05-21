export type View = 'onboarding' | 'rooms' | 'room' | 'profile';

export interface UserProfile {
  id: string;
  name: string;
  subjects: string[];
  artSeed: number;
  artColors: string[];
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Participant {
  id: string;
  name: string;
  subjects: string[];
  artSeed: number;
  artColors: string[];
  joinedAt: number;
  startedAt: number;
  isActive: boolean;
  weeklyMs: number;
  monthlyMs: number;
  totalMs: number;
}

export interface StudyRoom {
  id: string;
  name: string;
  subject: string;
  participants: Participant[];
  maxCapacity: number;
  messages: ChatMessage[];
  createdAt: number;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'total';

export interface LeaderboardEntry {
  id: string;
  name: string;
  artSeed: number;
  artColors: string[];
  subjects: string[];
  weeklyMs: number;
  monthlyMs: number;
  totalMs: number;
}

export type TimerMode = 'stopwatch' | 'countdown';

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  elapsed: number;
  target: number | null;
  startedAt: number | null;
}
