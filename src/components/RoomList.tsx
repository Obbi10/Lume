import { useState } from 'react';
import type { StudyRoom, UserProfile } from '../types';
import { generateShareCode } from '../utils/roomCode';
import AbstractAvatar from './AbstractAvatar';
import LumeLogo from './LumeLogo';
import { Users, ArrowRight, Plus, BookOpen, Flame, Clock, Copy, Check, Hash } from 'lucide-react';

interface Props {
  rooms: StudyRoom[];
  currentUser: UserProfile;
  todayMs: number;
  onJoin: (room: StudyRoom) => void;
  onJoinByCode: (code: string) => boolean;
  onViewProfile: () => void;
  onCreateRoom: () => void;
}

function formatTodayTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function RoomCard({ room, onJoin }: { room: StudyRoom; onJoin: () => void }) {
  const [copied, setCopied] = useState(false);
  const isFull = room.participants.length >= room.maxCapacity;

  const shareCode = generateShareCode(room.name, room.subject, room.maxCapacity, room.code);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl p-5 border border-border hover:border-accent/30 transition-all group animate-fade-in hover:glow-blue">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-text-primary font-semibold text-sm truncate">{room.name}</h3>
          <span className="text-accent/70 text-xs">{room.subject}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border flex-shrink-0 ml-2 ${
          isFull
            ? 'border-red-500/30 text-red-400 bg-red-500/5'
            : 'border-green-500/30 text-green-400 bg-green-500/5'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-400' : 'bg-green-400 live-dot'}`} />
          {isFull ? 'Full' : 'Open'}
        </div>
      </div>

      {/* Room code row */}
      <div className="flex items-center gap-2 mb-3 bg-bg-elevated border border-border rounded-xl px-3 py-2">
        <Hash size={11} className="text-text-muted flex-shrink-0" />
        <span className="text-text-muted text-xs flex-1">Share code</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 text-xs transition-colors flex-shrink-0 ${
            copied ? 'text-green-400' : 'text-accent hover:text-accent/80'
          }`}
        >
          {copied ? <><Check size={11} /> copied!</> : <><Copy size={11} /> copy &amp; share</>}
        </button>
      </div>

      {/* Participants row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex -space-x-2">
          {room.participants.slice(0, 5).map(p => (
            <AbstractAvatar
              key={p.id}
              seed={p.artSeed}
              colors={p.artColors}
              size={26}
              className="ring-2 ring-bg-primary"
            />
          ))}
          {room.participants.length === 0 && (
            <span className="text-text-muted text-xs italic">No one here yet</span>
          )}
          {room.participants.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-bg-elevated border-2 border-bg-primary flex items-center justify-center">
              <span className="text-[9px] text-text-muted">+{room.participants.length - 5}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Users size={11} />
          <span>{room.participants.length}/{room.maxCapacity}</span>
        </div>
      </div>

      <button
        onClick={onJoin}
        disabled={isFull}
        className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
          isFull
            ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
            : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-bg-primary'
        }`}
      >
        {isFull ? 'Room Full' : <>Enter Room <ArrowRight size={14} /></>}
      </button>
    </div>
  );
}

export default function RoomList({ rooms, currentUser, todayMs, onJoin, onJoinByCode, onViewProfile, onCreateRoom }: Props) {
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleJoinCode = () => {
    const trimmed = codeInput.trim();
    if (!trimmed) { setCodeError('Paste a share code first'); return; }
    const found = onJoinByCode(trimmed);
    if (!found) setCodeError('Code not recognised — make sure you copied the full share code');
  };

  const handleCodeChange = (val: string) => {
    setCodeInput(val);
    setCodeError('');
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <LumeLogo size={28} showText horizontal textClassName="text-xl" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted bg-bg-elevated border border-border px-3 py-1.5 rounded-full">
            <BookOpen size={11} />
            Study Rooms
          </div>
        </div>

        <button onClick={onViewProfile} className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
          <span className="text-text-secondary text-sm group-hover:text-text-primary transition-colors">
            {currentUser.name.split(' ')[0]}
          </span>
          <AbstractAvatar seed={currentUser.artSeed} colors={currentUser.artColors} size={32} className="ring-2 ring-border group-hover:ring-accent/40 transition-all" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-text-primary text-2xl font-bold">Study Rooms</h1>
            <p className="text-text-muted text-sm mt-0.5">Enter a code to join, or create your own</p>
          </div>
          <button
            onClick={onCreateRoom}
            className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all glow-blue hover:glow-blue-lg"
          >
            <Plus size={16} />
            New Room
          </button>
        </div>

        {/* Stats banner */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass border border-border rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-orange-500/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/15 transition-colors">
              <Flame size={18} className="text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-text-primary text-2xl font-bold leading-none">{currentUser.streak}</span>
                <span className="text-text-muted text-xs">{currentUser.streak === 1 ? 'day' : 'days'}</span>
              </div>
              <p className="text-text-muted text-xs mt-0.5">
                {currentUser.streak >= 7 ? '🔥 on fire' : currentUser.streak >= 3 ? 'great streak' : 'current streak'}
              </p>
            </div>
          </div>

          <div className="glass border border-border rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-accent/30 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
              <Clock size={18} className="text-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-text-primary text-2xl font-bold leading-none">{formatTodayTime(todayMs)}</span>
              </div>
              <p className="text-text-muted text-xs mt-0.5">
                {todayMs === 0 ? 'nothing yet today' : todayMs < 1800000 ? 'good start' : todayMs < 7200000 ? 'solid session' : 'great work today'}
              </p>
            </div>
          </div>
        </div>

        {/* Join by code */}
        <div className="glass border border-border rounded-2xl p-5 mb-6">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Join a Room</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={e => handleCodeChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinCode()}
              placeholder="Paste share code here"
              className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:border-accent/50 transition-colors font-mono"
            />
            <button
              onClick={handleJoinCode}
              className="bg-accent text-bg-primary px-5 py-3 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all glow-blue flex items-center gap-2"
            >
              Join
              <ArrowRight size={15} />
            </button>
          </div>
          {codeError && <p className="text-red-400 text-xs mt-2">{codeError}</p>}
        </div>

        {/* Room list */}
        {rooms.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
              <BookOpen size={22} className="text-text-muted/50" />
            </div>
            <p className="text-sm font-medium text-text-secondary">No rooms yet</p>
            <p className="text-xs mt-1">Create a room or enter a code above to join one</p>
          </div>
        ) : (
          <>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Your Rooms</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {rooms.map(room => (
                <RoomCard key={room.id} room={room} onJoin={() => onJoin(room)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
