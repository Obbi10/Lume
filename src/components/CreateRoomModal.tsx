import { useState } from 'react';
import type { StudyRoom } from '../types';
import { X, ArrowRight, Copy, Check } from 'lucide-react';

const SUBJECT_OPTIONS = [
  'Mixed', 'Sciences', 'Humanities', 'STEM', 'Languages', 'Arts',
  'Social Sciences', 'Business', 'Technology', 'Relaxed',
];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

interface Props {
  onClose: () => void;
  onCreate: (room: Omit<StudyRoom, 'participants' | 'messages' | 'createdAt'>) => void;
}

export default function CreateRoomModal({ onClose, onCreate }: Props) {
  const [roomName, setRoomName] = useState('');
  const [subject, setSubject] = useState('Mixed');
  const [capacity, setCapacity] = useState(10);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [code] = useState(generateRoomCode);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (roomName.trim().length < 3) { setError('Room name must be at least 3 characters'); return; }
    setStep('code');
  };

  const handleEnter = () => {
    onCreate({ id: `room-${Date.now()}`, name: roomName.trim(), subject, maxCapacity: capacity, code });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-sm border border-border animate-slide-up shadow-card">

        {step === 'form' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-primary font-semibold">Create a Room</h3>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-elevated">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-text-muted text-xs uppercase tracking-wider block mb-2">Room Name</label>
                <input
                  autoFocus
                  type="text"
                  value={roomName}
                  onChange={e => { setRoomName(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Late Night Grind"
                  className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-text-muted text-xs uppercase tracking-wider block mb-2">Focus Area</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        subject === s
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-text-muted hover:border-accent/30 hover:text-text-secondary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-text-muted text-xs uppercase tracking-wider block mb-2">
                  Max Capacity: <span className="text-accent">{capacity}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="w-full accent-[#38bdf8]"
                />
                <div className="flex justify-between text-text-muted text-xs mt-1">
                  <span>2</span><span>20</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                onClick={handleCreate}
                className="w-full bg-accent text-bg-primary font-semibold py-3 rounded-xl hover:bg-accent/90 transition-all glow-blue mt-2"
              >
                Create Room
              </button>
            </div>
          </>
        )}

        {step === 'code' && (
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-text-primary font-semibold">Room Created!</h3>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-elevated">
                <X size={18} />
              </button>
            </div>

            <p className="text-text-muted text-sm mb-6">Share this code so others can join your room</p>

            {/* Code display */}
            <div className="bg-bg-elevated border border-accent/25 rounded-2xl p-6 mb-3">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Room Code</p>
              <p className="text-accent font-mono text-4xl font-bold tracking-[0.2em] glow-blue">{code}</p>
              <p className="text-text-muted text-xs mt-3 truncate">{roomName} · {subject}</p>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all mb-3 ${
                copied
                  ? 'border-green-500/40 text-green-400 bg-green-500/5'
                  : 'border-border text-text-secondary hover:border-accent/30 hover:text-accent'
              }`}
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
            </button>

            <button
              onClick={handleEnter}
              className="w-full bg-accent text-bg-primary font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-all glow-blue hover:glow-blue-lg"
            >
              Enter Room
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
