import type { StudyRoom, UserProfile } from '../types';
import AbstractAvatar from './AbstractAvatar';
import { Users, ArrowRight, Plus, BookOpen } from 'lucide-react';

interface Props {
  rooms: StudyRoom[];
  currentUser: UserProfile;
  onJoin: (room: StudyRoom) => void;
  onViewProfile: () => void;
  onCreateRoom: () => void;
}

function RoomCard({ room, onJoin }: { room: StudyRoom; onJoin: () => void }) {
  const isFull = room.participants.length >= room.maxCapacity;

  return (
    <div className="glass rounded-2xl p-5 border border-border hover:border-accent/30 transition-all group animate-fade-in hover:glow-blue">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{room.name}</h3>
          <span className="text-accent/70 text-xs">{room.subject}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          isFull
            ? 'border-red-500/30 text-red-400 bg-red-500/5'
            : 'border-green-500/30 text-green-400 bg-green-500/5'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-400' : 'bg-green-400 live-dot'}`} />
          {isFull ? 'Full' : 'Open'}
        </div>
      </div>

      {/* Participants row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex -space-x-2">
          {room.participants.slice(0, 5).map(p => (
            <AbstractAvatar
              key={p.id}
              seed={p.artSeed}
              colors={p.artColors}
              size={28}
              className="ring-2 ring-bg-primary"
            />
          ))}
          {room.participants.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-bg-elevated border-2 border-bg-primary flex items-center justify-center">
              <span className="text-[9px] text-text-muted">+{room.participants.length - 5}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Users size={11} />
          <span>{room.participants.length}/{room.maxCapacity}</span>
        </div>
      </div>

      {/* Subjects cloud */}
      <div className="flex flex-wrap gap-1 mb-4">
        {Array.from(new Set(room.participants.flatMap(p => p.subjects))).slice(0, 4).map(s => (
          <span key={s} className="text-[10px] text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full border border-border">
            {s}
          </span>
        ))}
      </div>

      <button
        onClick={onJoin}
        disabled={isFull}
        className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
          isFull
            ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
            : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-bg-primary group-hover:shadow-accent'
        }`}
      >
        {isFull ? 'Room Full' : <>Join Room <ArrowRight size={14} /></>}
      </button>
    </div>
  );
}

export default function RoomList({ rooms, currentUser, onJoin, onViewProfile, onCreateRoom }: Props) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-accent text-xl font-bold tracking-tight">lume</span>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-text-primary text-2xl font-bold">Study Rooms</h1>
            <p className="text-text-muted text-sm mt-0.5">Find your focus, join a room</p>
          </div>
          <button
            onClick={onCreateRoom}
            className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all glow-blue hover:glow-blue-lg"
          >
            <Plus size={16} />
            New Room
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {rooms.map(room => (
            <RoomCard key={room.id} room={room} onJoin={() => onJoin(room)} />
          ))}
        </div>
      </main>
    </div>
  );
}
