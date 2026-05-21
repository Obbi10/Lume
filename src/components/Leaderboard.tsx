import { useState } from 'react';
import type { LeaderboardEntry, LeaderboardPeriod, UserProfile } from '../types';
import AbstractAvatar from './AbstractAvatar';
import { Trophy } from 'lucide-react';

function formatHours(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  weekly: 'This Week',
  monthly: 'This Month',
  total: 'All Time',
};

const MEDAL = ['🥇', '🥈', '🥉'];

interface Props {
  entries: LeaderboardEntry[];
  currentUser: UserProfile;
  currentUserMs?: number;
}

export default function Leaderboard({ entries, currentUser, currentUserMs = 0 }: Props) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  const msKey: Record<LeaderboardPeriod, keyof LeaderboardEntry> = {
    weekly: 'weeklyMs',
    monthly: 'monthlyMs',
    total: 'totalMs',
  };

  // Inject current user into the list
  const allEntries: LeaderboardEntry[] = [
    {
      id: currentUser.id,
      name: currentUser.name,
      artSeed: currentUser.artSeed,
      artColors: currentUser.artColors,
      subjects: currentUser.subjects,
      weeklyMs: currentUserMs,
      monthlyMs: currentUserMs,
      totalMs: currentUserMs,
    },
    ...entries,
  ];

  const sorted = [...allEntries].sort(
    (a, b) => (b[msKey[period]] as number) - (a[msKey[period]] as number)
  );

  const userRank = sorted.findIndex(e => e.id === currentUser.id) + 1;

  return (
    <div className="glass rounded-2xl border border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-accent" />
          <span className="text-text-primary text-sm font-semibold">Leaderboard</span>
          <span className="ml-auto text-text-muted text-xs bg-bg-elevated px-2 py-0.5 rounded-full border border-border">
            #{userRank}
          </span>
        </div>

        {/* Period tabs */}
        <div className="flex bg-bg-elevated border border-border rounded-xl p-0.5 gap-0.5">
          {(Object.keys(PERIOD_LABELS) as LeaderboardPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                period === p
                  ? 'bg-accent text-bg-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.map((entry, idx) => {
          const isCurrentUser = entry.id === currentUser.id;
          const ms = entry[msKey[period]] as number;
          const rank = idx + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-0.5 transition-all ${
                isCurrentUser
                  ? 'bg-accent/8 border border-accent/20'
                  : 'hover:bg-bg-elevated/60'
              }`}
            >
              {/* Rank */}
              <div className="w-5 flex-shrink-0 text-center">
                {isTop3 ? (
                  <span className="text-sm leading-none">{MEDAL[rank - 1]}</span>
                ) : (
                  <span className="text-text-muted text-xs font-mono">{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <AbstractAvatar
                seed={entry.artSeed}
                colors={entry.artColors}
                size={28}
                className={isCurrentUser ? 'ring-2 ring-accent/40' : ''}
              />

              {/* Name + subjects */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium truncate ${isCurrentUser ? 'text-accent' : 'text-text-primary'}`}>
                    {entry.name.split(' ')[0]}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[9px] text-accent/60 bg-accent/10 px-1 py-0.5 rounded-full flex-shrink-0">you</span>
                  )}
                </div>
                <p className="text-text-muted text-[10px] truncate">
                  {entry.subjects.slice(0, 2).join(', ')}
                </p>
              </div>

              {/* Time */}
              <div className="text-right flex-shrink-0">
                <span className={`text-xs font-mono font-medium ${isTop3 && rank === 1 ? 'text-accent' : 'text-text-secondary'}`}>
                  {formatHours(ms)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: user's own stats */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Your {PERIOD_LABELS[period].toLowerCase()}</span>
          <span className="text-accent font-mono font-medium">{formatHours(currentUserMs)}</span>
        </div>
        <div className="mt-1.5 h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (currentUserMs / ((sorted[0]?.[msKey[period]] as number) || 1)) * 100)}%`,
            }}
          />
        </div>
        <p className="text-text-muted text-[10px] mt-1">
          {userRank === 1 ? 'You\'re leading — keep going!' : `${formatHours((sorted[0]?.[msKey[period]] as number ?? 0) - currentUserMs)} behind 1st place`}
        </p>
      </div>
    </div>
  );
}
