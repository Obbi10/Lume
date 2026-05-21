import { CheckCircle2 } from 'lucide-react';
import { formatDuration } from '../utils/time';

function motivationalMessage(ms: number): string {
  const minutes = ms / 60000;
  if (minutes < 10) return "Every minute counts — well done.";
  if (minutes < 20) return "Good start. Consistency is everything.";
  if (minutes < 40) return "Solid session. Keep building the habit.";
  if (minutes < 60) return "Great focus. You're making real progress.";
  if (minutes < 90) return "Strong work. Your effort adds up.";
  if (minutes < 120) return "Impressive dedication. Keep it going 💪";
  return "Outstanding session. You're on another level 🔥";
}

function breakdownLabel(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (parts.length === 0 && seconds > 0) parts.push(`${seconds} sec`);
  return parts.join(' ');
}

interface Props {
  durationMs: number;
  onConfirm: () => void;
}

export default function SessionCompleteModal({ durationMs, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass border border-border rounded-2xl p-8 w-full max-w-sm text-center shadow-card animate-slide-up">

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center glow-blue">
            <CheckCircle2 size={32} className="text-accent" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-text-primary text-lg font-semibold mb-1">Session complete</h2>
        <p className="text-text-muted text-sm mb-6">{motivationalMessage(durationMs)}</p>

        {/* Duration display */}
        <div className="bg-bg-elevated border border-border rounded-xl px-6 py-5 mb-6">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-2">Time studied</p>
          <p className="timer-display text-4xl font-semibold text-text-primary leading-none mb-1">
            {formatDuration(durationMs)}
          </p>
          <p className="text-text-muted text-sm">{breakdownLabel(durationMs)}</p>
        </div>

        {/* Stats update hint */}
        <p className="text-text-muted text-xs mb-5">
          Your weekly, monthly and all-time rankings will be updated.
        </p>

        {/* Confirm */}
        <button
          onClick={onConfirm}
          className="w-full bg-accent text-bg-primary font-semibold py-3 rounded-xl hover:bg-accent/90 transition-all glow-blue hover:glow-blue-lg text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
