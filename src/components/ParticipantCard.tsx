import type { Participant } from '../types';
import { formatShortDuration } from '../utils/time';
import AbstractAvatar from './AbstractAvatar';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  participant: Participant;
  isCurrentUser?: boolean;
}

export default function ParticipantCard({ participant, isCurrentUser }: Props) {
  const [elapsed, setElapsed] = useState(Date.now() - participant.startedAt);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - participant.startedAt);
    }, 10000);
    return () => clearInterval(interval);
  }, [participant.startedAt]);

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
      isCurrentUser ? 'bg-accent/5 border border-accent/20' : 'hover:bg-bg-elevated/50'
    }`}>
      <div className="relative flex-shrink-0">
        <AbstractAvatar seed={participant.artSeed} colors={participant.artColors} size={36} />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-bg-primary rounded-full live-dot" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-text-primary text-xs font-medium truncate">
            {participant.name.split(' ')[0]}
          </span>
          {isCurrentUser && (
            <span className="text-accent text-[10px] bg-accent/10 px-1.5 py-0.5 rounded-full">you</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-text-muted text-[10px]">
          <Clock size={9} />
          <span>{formatShortDuration(elapsed)}</span>
        </div>
      </div>
    </div>
  );
}
