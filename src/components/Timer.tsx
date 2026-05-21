import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerMode } from '../types';
import { formatDuration } from '../utils/time';
import { Play, Pause, Square, ChevronUp, ChevronDown } from 'lucide-react';

const PRESET_MINUTES = [25, 45, 60, 90, 120];
const STORAGE_KEY = 'lume_timer_state';

interface SavedState {
  startedAt: number;
  accumulated: number;
  mode: TimerMode;
  target: number;
}

interface Props {
  onSessionEnd?: (durationMs: number) => void;
}

export default function Timer({ onSessionEnd }: Props) {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [target, setTarget] = useState(25 * 60 * 1000);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCustom, setShowCustom] = useState(false);
  // displayMs = elapsed time (0→∞ stopwatch, 0→target countdown)
  const [displayMs, setDisplayMs] = useState(0);

  // All timing data in refs — no stale-closure issues inside callbacks
  const startedAtRef   = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef   = useRef(false);
  const modeRef        = useRef<TimerMode>('stopwatch');
  const targetRef      = useRef(25 * 60 * 1000);
  const onEndRef       = useRef(onSessionEnd);

  useEffect(() => { onEndRef.current = onSessionEnd; }, [onSessionEnd]);

  // ── helpers ──────────────────────────────────────────────────────────────
  const getElapsed = useCallback((): number => {
    if (startedAtRef.current === null) return accumulatedRef.current;
    return accumulatedRef.current + (Date.now() - startedAtRef.current);
  }, []);

  const saveToStorage = useCallback(() => {
    if (startedAtRef.current === null) return;
    const state: SavedState = {
      startedAt:   startedAtRef.current,
      accumulated: accumulatedRef.current,
      mode:        modeRef.current,
      target:      targetRef.current,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const clearStorage = () => sessionStorage.removeItem(STORAGE_KEY);

  // ── tick ─────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const elapsed = getElapsed();

    if (modeRef.current === 'countdown') {
      setDisplayMs(Math.min(elapsed, targetRef.current));

      if (elapsed >= targetRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        accumulatedRef.current = 0;
        startedAtRef.current   = null;
        isRunningRef.current   = false;
        clearStorage();
        setIsRunning(false);
        setDisplayMs(0);
        onEndRef.current?.(targetRef.current);
      }
    } else {
      setDisplayMs(elapsed);
    }
  }, [getElapsed]);

  // ── restore saved session on mount ───────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved: SavedState = JSON.parse(raw);
      accumulatedRef.current = saved.accumulated;
      startedAtRef.current   = saved.startedAt;
      modeRef.current        = saved.mode;
      targetRef.current      = saved.target;
      setMode(saved.mode);
      setTarget(saved.target);
      setCustomMinutes(Math.round(saved.target / 60000));
      isRunningRef.current = true;
      setIsRunning(true);
    } catch {
      clearStorage();
    }
  // run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── start / stop interval ────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      isRunningRef.current = true;
      if (startedAtRef.current === null) startedAtRef.current = Date.now();
      saveToStorage();
      tick(); // immediate display sync
      intervalRef.current = setInterval(tick, 500);
    } else {
      isRunningRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (startedAtRef.current !== null) {
        accumulatedRef.current = getElapsed();
        startedAtRef.current   = null;
      }
      clearStorage();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // ── re-sync interval when tick changes (target / mode changed mid-run) ───
  useEffect(() => {
    if (isRunningRef.current) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, 500);
    }
  }, [tick]);

  // ── immediately recalculate when tab becomes visible ─────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isRunningRef.current) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tick]);

  // ── controls ─────────────────────────────────────────────────────────────
  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);

  const handleStop = () => {
    const finalElapsed = getElapsed();
    if (intervalRef.current) clearInterval(intervalRef.current);
    accumulatedRef.current = 0;
    startedAtRef.current   = null;
    isRunningRef.current   = false;
    clearStorage();
    setIsRunning(false);
    setDisplayMs(0);
    if (finalElapsed > 1000) onEndRef.current?.(finalElapsed);
  };

  const handleModeSwitch = (m: TimerMode) => {
    if (isRunning) return;
    modeRef.current        = m;
    accumulatedRef.current = 0;
    startedAtRef.current   = null;
    setMode(m);
    setDisplayMs(0);
  };

  const handleTargetChange = (ms: number) => {
    targetRef.current      = ms;
    accumulatedRef.current = 0;
    startedAtRef.current   = null;
    setTarget(ms);
    setDisplayMs(0);
  };

  // ── derived display values ────────────────────────────────────────────────
  const shownMs       = mode === 'countdown' ? Math.max(0, target - displayMs) : displayMs;
  const progress      = mode === 'countdown' ? displayMs / target : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset    = circumference * (1 - Math.min(1, progress));

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
            {formatDuration(shownMs)}
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
                onClick={() => { handleTargetChange(m * 60 * 1000); setCustomMinutes(m); }}
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
                onClick={() => { const n = Math.max(1, customMinutes - 5); setCustomMinutes(n); handleTargetChange(n * 60 * 1000); }}
                className="text-text-muted hover:text-accent transition-colors"
              >
                <ChevronDown size={16} />
              </button>
              <span className="text-text-primary text-sm w-16 text-center timer-display">
                {customMinutes} min
              </span>
              <button
                onClick={() => { const n = Math.min(300, customMinutes + 5); setCustomMinutes(n); handleTargetChange(n * 60 * 1000); }}
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
            {displayMs > 0 ? 'Resume' : 'Start'}
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

        {(displayMs > 0 || isRunning) && (
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
