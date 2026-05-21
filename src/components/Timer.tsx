import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerMode } from '../types';
import { formatDuration } from '../utils/time';
import { Play, Pause, Square, ChevronUp, ChevronDown } from 'lucide-react';

const PRESET_MINUTES = [25, 45, 60, 90, 120];

interface Props {
  onSessionEnd?: (durationMs: number) => void;
}

export default function Timer({ onSessionEnd }: Props) {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState(25 * 60 * 1000);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCustom, setShowCustom] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const tick = useCallback(() => {
    if (startedAt === null) return;
    const now = Date.now();
    const newElapsed = elapsedRef.current + (now - startedAt);
    setElapsed(newElapsed);

    if (mode === 'countdown' && newElapsed >= target) {
      setElapsed(target);
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      onSessionEnd?.(target);
    }
  }, [startedAt, mode, target, onSessionEnd]);

  useEffect(() => {
    if (isRunning) {
      setStartedAt(Date.now());
      intervalRef.current = setInterval(tick, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (startedAt !== null) {
        elapsedRef.current = elapsed;
        setStartedAt(null);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, 500);
    }
  }, [tick]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);

  const handleStop = () => {
    setIsRunning(false);
    const finalElapsed = elapsed;
    setElapsed(0);
    elapsedRef.current = 0;
    if (finalElapsed > 1000) onSessionEnd?.(finalElapsed);
  };

  const handleModeSwitch = (m: TimerMode) => {
    if (isRunning) return;
    setMode(m);
    setElapsed(0);
    elapsedRef.current = 0;
  };

  const displayMs = mode === 'countdown' ? Math.max(0, target - elapsed) : elapsed;
  const progress = mode === 'countdown' ? elapsed / target : 0;

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      {/* Mode selector */}
      <div className="flex bg-bg-elevated border border-border rounded-full p-1 mb-6 gap-1">
        {(['stopwatch', 'countdown'] as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
              mode === m
                ? 'bg-accent text-bg-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative mb-4">
        <svg width={128} height={128} className="-rotate-90">
          <circle cx={64} cy={64} r={54} fill="none" stroke="#1e2235" strokeWidth={4} />
          {mode === 'countdown' && (
            <circle
              cx={64} cy={64} r={54}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500"
              style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.5))' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="timer-display text-2xl font-medium text-text-primary">
            {formatDuration(displayMs)}
          </span>
          {mode === 'stopwatch' && isRunning && (
            <span className="text-accent text-xs mt-0.5 live-dot">●</span>
          )}
        </div>
      </div>

      {/* Countdown presets */}
      {mode === 'countdown' && !isRunning && (
        <div className="mb-4 w-full">
          <div className="flex flex-wrap gap-1.5 justify-center mb-2">
            {PRESET_MINUTES.map(m => (
              <button
                key={m}
                onClick={() => { setTarget(m * 60 * 1000); setElapsed(0); elapsedRef.current = 0; setCustomMinutes(m); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  target === m * 60 * 1000
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-muted hover:border-accent/40 hover:text-text-secondary'
                }`}
              >
                {m}m
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                showCustom ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted hover:border-accent/40'
              }`}
            >
              custom
            </button>
          </div>

          {showCustom && (
            <div className="flex items-center justify-center gap-3 animate-fade-in">
              <button
                onClick={() => { const n = Math.max(1, customMinutes - 5); setCustomMinutes(n); setTarget(n * 60 * 1000); }}
                className="text-text-muted hover:text-accent transition-colors"
              >
                <ChevronDown size={16} />
              </button>
              <span className="text-text-primary text-sm w-16 text-center timer-display">
                {customMinutes} min
              </span>
              <button
                onClick={() => { const n = Math.min(300, customMinutes + 5); setCustomMinutes(n); setTarget(n * 60 * 1000); }}
                className="text-text-muted hover:text-accent transition-colors"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 bg-accent text-bg-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-accent/90 transition-all glow-blue hover:glow-blue-lg"
          >
            <Play size={16} fill="currentColor" />
            {elapsed > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 bg-bg-elevated border border-accent/30 text-accent px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-accent/10 transition-all"
          >
            <Pause size={16} />
            Pause
          </button>
        )}

        {(elapsed > 0 || isRunning) && (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 bg-bg-elevated border border-border text-text-muted px-4 py-2.5 rounded-full text-sm hover:border-red-500/40 hover:text-red-400 transition-all"
          >
            <Square size={14} fill="currentColor" />
            End
          </button>
        )}
      </div>
    </div>
  );
}
