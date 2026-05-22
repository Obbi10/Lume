import { useState, useEffect, useCallback, useRef } from 'react';
import type { StudyRoom as StudyRoomType, UserProfile, ChatMessage, Participant } from '../types';
import { db } from '../firebase';
import { ref, set, update, remove, push, onValue, onDisconnect } from 'firebase/database';
import Timer from './Timer';
import ChatBox from './ChatBox';
import ParticipantCard from './ParticipantCard';
import AbstractAvatar from './AbstractAvatar';
import SessionCompleteModal from './SessionCompleteModal';
import { ArrowLeft, Users, MessageSquare, Clock, Trophy, Settings, Trash2, X, LogOut, Crown } from 'lucide-react';
import { formatShortDuration } from '../utils/time';

const SUBJECT_OPTIONS = [
  'Mixed', 'Sciences', 'Humanities', 'STEM', 'Languages', 'Arts',
  'Social Sciences', 'Business', 'Technology', 'Relaxed',
];

interface Props {
  room: StudyRoomType;
  currentUser: UserProfile;
  onLeave: () => void;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  onUpdateRoom: (updates: { name: string; subject: string; maxCapacity: number }) => void;
  onSessionConfirmed: (ms: number) => void;
}

type Panel = 'timer' | 'people' | 'chat' | 'ranks';
type RightTab = 'people' | 'chat' | 'ranks';

const MEDALS = ['🥇', '🥈', '🥉'];

type Period = 'session' | 'weekly' | 'monthly' | 'total';

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: 'session', label: 'Session' },
  { id: 'weekly', label: 'Week' },
  { id: 'monthly', label: 'Month' },
  { id: 'total', label: 'All Time' },
];

function formatHours(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function RoomLeaderboard({
  participants,
  currentUserId,
  ownerId,
}: {
  participants: Participant[];
  currentUserId: string;
  ownerId: string;
}) {
  const [period, setPeriod] = useState<Period>('weekly');

  const getMsForPeriod = (p: Participant) => {
    if (period === 'session') return p.sessionMs ?? 0;
    if (period === 'weekly') return p.weeklyMs ?? 0;
    if (period === 'monthly') return p.monthlyMs ?? 0;
    return p.totalMs ?? 0;
  };

  const sorted = [...participants].sort((a, b) => getMsForPeriod(b) - getMsForPeriod(a));
  const userRank = sorted.findIndex(p => p.id === currentUserId) + 1;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <Trophy size={12} className="text-accent" />
          <span className="text-text-muted text-xs uppercase tracking-wider">Rankings</span>
          <span className="ml-auto text-accent text-xs bg-accent/10 px-2 py-0.5 rounded-full">#{userRank}</span>
        </div>
        <div className="flex bg-bg-elevated border border-border rounded-xl p-0.5 gap-0.5">
          {PERIOD_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                period === t.id
                  ? 'bg-accent text-bg-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sorted.map((p, idx) => {
          const isCurrentUser = p.id === currentUserId;
          const isRoomOwner = p.id === ownerId;
          const ms = getMsForPeriod(p);
          const rank = idx + 1;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-0.5 transition-all ${
                isCurrentUser ? 'bg-accent/8 border border-accent/20' : 'hover:bg-bg-elevated/50'
              }`}
            >
              <div className="w-5 flex-shrink-0 text-center">
                {rank <= 3
                  ? <span className="text-sm leading-none">{MEDALS[rank - 1]}</span>
                  : <span className="text-text-muted text-xs font-mono">{rank}</span>
                }
              </div>
              <AbstractAvatar seed={p.artSeed} colors={p.artColors} size={30} className={isCurrentUser ? 'ring-2 ring-accent/40' : ''} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {isRoomOwner && <Crown size={10} className="text-yellow-400 flex-shrink-0" />}
                  <span className={`text-xs font-medium truncate ${isCurrentUser ? 'text-accent' : 'text-text-primary'}`}>
                    {p.name.split(' ')[0]}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[9px] text-accent/60 bg-accent/10 px-1 py-0.5 rounded-full flex-shrink-0">you</span>
                  )}
                </div>
                <p className="text-text-muted text-[10px] truncate">{p.subjects.slice(0, 2).join(', ')}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-xs font-mono font-medium ${rank === 1 ? 'text-accent' : 'text-text-secondary'}`}>
                  {period === 'session' ? formatShortDuration(ms) : formatHours(ms)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudyRoom({
  room: initialRoom,
  currentUser,
  onLeave,
  onLeaveRoom,
  onDeleteRoom,
  onUpdateRoom,
  onSessionConfirmed,
}: Props) {
  const [activePanel, setActivePanel] = useState<Panel>('timer');
  const [rightTab, setRightTab] = useState<RightTab>('people');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [pendingSessionMs, setPendingSessionMs] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Owner UI state
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [editName, setEditName] = useState(initialRoom.name);
  const [editSubject, setEditSubject] = useState(initialRoom.subject);
  const [editCapacity, setEditCapacity] = useState(initialRoom.maxCapacity);

  const roomCode = initialRoom.code;
  const isOwner = initialRoom.ownerId === currentUser.id;
  const presenceWritten = useRef(false);

  // Write own presence on mount; remove it on leave or disconnect
  useEffect(() => {
    const safe = (v: number) => (Number.isFinite(v) && v >= 0 ? v : 0);
    const me: Participant = {
      id: currentUser.id,
      name: currentUser.name,
      subjects: currentUser.subjects,
      artSeed: currentUser.artSeed,
      artColors: currentUser.artColors,
      joinedAt: Date.now(),
      startedAt: Date.now(),
      isActive: true,
      sessionMs: 0,
      weeklyMs:  safe(currentUser.weeklyMs),
      monthlyMs: safe(currentUser.monthlyMs),
      totalMs:   safe(currentUser.totalMs),
    };
    const pRef = ref(db, `rooms/${roomCode}/participants/${currentUser.id}`);
    set(pRef, me)
      .then(() => { presenceWritten.current = true; })
      .catch(console.error);
    onDisconnect(pRef).remove();
    return () => { remove(pRef).catch(console.error); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live participants feed — also detects being kicked
  useEffect(() => {
    const pRef = ref(db, `rooms/${roomCode}/participants`);
    return onValue(pRef, (snap) => {
      const data = snap.val();
      const list = data ? (Object.values(data) as Participant[]) : [];
      setParticipants(list);
      // If our presence was written but we're no longer in the list, we were kicked
      if (presenceWritten.current && !list.find(p => p.id === currentUser.id)) {
        onLeaveRoom();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live messages feed
  useEffect(() => {
    const mRef = ref(db, `rooms/${roomCode}/messages`);
    return onValue(mRef, (snap) => {
      const data = snap.val();
      if (!data) { setMessages([]); return; }
      const msgs = (Object.values(data) as ChatMessage[]).sort((a, b) => a.timestamp - b.timestamp);
      setMessages(msgs);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize handler
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close owner menu when clicking outside
  useEffect(() => {
    if (!showOwnerMenu) return;
    const handler = () => setShowOwnerMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showOwnerMenu]);

  const handleSendMessage = useCallback((text: string) => {
    push(ref(db, `rooms/${roomCode}/messages`), {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name.split(' ')[0],
      text,
      timestamp: Date.now(),
    }).catch(console.error);
  }, [currentUser, roomCode]);

  const handleSessionEnd = useCallback((durationMs: number) => {
    if (durationMs > 0) setPendingSessionMs(durationMs);
  }, []);

  const handleConfirmSession = useCallback(() => {
    if (pendingSessionMs === null) return;
    const ms = pendingSessionMs;
    setSessionDuration(prev => prev + ms);

    const currentP = participants.find(p => p.id === currentUser.id);
    const safe = (v: number | undefined) => (Number.isFinite(v) && (v ?? 0) >= 0 ? (v ?? 0) : 0);
    update(ref(db, `rooms/${roomCode}/participants/${currentUser.id}`), {
      sessionMs: safe(currentP?.sessionMs) + ms,
      weeklyMs:  safe(currentP?.weeklyMs)  + ms,
      monthlyMs: safe(currentP?.monthlyMs) + ms,
      totalMs:   safe(currentP?.totalMs)   + ms,
    }).catch(console.error);

    push(ref(db, `rooms/${roomCode}/messages`), {
      id: `msg-sys-${Date.now()}`,
      userId: 'system',
      userName: 'lume',
      text: `${currentUser.name.split(' ')[0]} finished a session 🎉`,
      timestamp: Date.now(),
    }).catch(console.error);

    onSessionConfirmed(ms);
    setPendingSessionMs(null);
  }, [pendingSessionMs, currentUser, participants, onSessionConfirmed, roomCode]);

  const handleKickParticipant = useCallback((userId: string) => {
    remove(ref(db, `rooms/${roomCode}/participants/${userId}`)).catch(console.error);
  }, [roomCode]);

  const handleConfirmDelete = useCallback(() => {
    remove(ref(db, `rooms/${roomCode}`)).catch(console.error);
    onDeleteRoom();
  }, [roomCode, onDeleteRoom]);

  const handleSaveEdit = useCallback(() => {
    if (editName.trim().length < 3) return;
    onUpdateRoom({ name: editName.trim(), subject: editSubject, maxCapacity: editCapacity });
    setShowEditModal(false);
  }, [editName, editSubject, editCapacity, onUpdateRoom]);

  const mobileTabs: { id: Panel; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'timer', label: 'Timer', icon: <Clock size={14} /> },
    { id: 'ranks', label: 'Ranks', icon: <Trophy size={14} /> },
    { id: 'people', label: 'People', icon: <Users size={14} />, badge: participants.length },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={14} /> },
  ];

  const rightTabs: { id: RightTab; label: string; icon: React.ReactNode }[] = [
    { id: 'people', label: 'People', icon: <Users size={12} /> },
    { id: 'ranks', label: 'Ranks', icon: <Trophy size={12} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={12} /> },
  ];

  const peoplePanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {participants.map(p => (
            <ParticipantCard
              key={p.id}
              participant={p}
              isCurrentUser={p.id === currentUser.id}
              isOwner={p.id === initialRoom.ownerId}
              canKick={isOwner}
              onKick={() => handleKickParticipant(p.id)}
            />
          ))}
        </div>
      </div>
      {!isOwner && (
        <div className="p-2 border-t border-border flex-shrink-0">
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-text-muted border border-border hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={13} />
            Leave Room
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-dvh bg-bg-primary flex flex-col overflow-hidden">
      <header className="glass border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onLeave} className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-bg-elevated">
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-text-primary font-semibold text-sm truncate">{initialRoom.name}</h2>
          <div className="flex items-center gap-3 text-text-muted text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full live-dot inline-block" />
              {participants.length} studying now
            </span>
            <span className="text-accent/60 font-mono tracking-widest">{initialRoom.code}</span>
          </div>
        </div>

        {/* Owner settings button */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowOwnerMenu(v => !v); }}
              className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-bg-elevated"
              title="Room settings"
            >
              <Settings size={16} />
            </button>
            {showOwnerMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 glass rounded-xl border border-border shadow-card min-w-[150px] py-1 animate-fade-in">
                <button
                  onClick={e => { e.stopPropagation(); setShowOwnerMenu(false); setEditName(initialRoom.name); setEditSubject(initialRoom.subject); setEditCapacity(initialRoom.maxCapacity); setShowEditModal(true); }}
                  className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2"
                >
                  <Settings size={12} />
                  Edit Room
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setShowOwnerMenu(false); setShowDeleteConfirm(true); }}
                  className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={12} />
                  Delete Room
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex -space-x-1.5">
          {participants.slice(0, 4).map(p => (
            <AbstractAvatar key={p.id} seed={p.artSeed} colors={p.artColors} size={24} className="ring-2 ring-bg-primary" />
          ))}
          {participants.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-bg-elevated border-2 border-bg-primary flex items-center justify-center">
              <span className="text-[8px] text-text-muted">+{participants.length - 4}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {!isMobile ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-border">
              <div className="w-full max-w-sm">
                <h3 className="text-text-muted text-xs uppercase tracking-widest mb-6 text-center">Focus Timer</h3>
                <Timer onSessionEnd={handleSessionEnd} />
                {sessionDuration > 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-text-muted text-xs">Session total</p>
                    <p className="text-accent font-mono text-lg mt-0.5">
                      {Math.floor(sessionDuration / 3600000)}h {Math.floor((sessionDuration % 3600000) / 60000)}m
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-72 flex flex-col">
              <div className="flex border-b border-border bg-bg-secondary flex-shrink-0">
                {rightTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all relative ${
                      rightTab === tab.id ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {rightTab === tab.id && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {rightTab === 'people' && (
                  <div className="flex flex-col h-full animate-fade-in">
                    {peoplePanel}
                  </div>
                )}
                {rightTab === 'ranks' && (
                  <div className="flex flex-col h-full animate-fade-in">
                    <RoomLeaderboard participants={participants} currentUserId={currentUser.id} ownerId={initialRoom.ownerId} />
                  </div>
                )}
                {rightTab === 'chat' && (
                  <div className="flex flex-col h-full animate-fade-in">
                    <ChatBox messages={messages} currentUser={currentUser} participants={participants} onSend={handleSendMessage} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              {activePanel === 'timer' && (
                <div className="flex flex-col items-center justify-center p-8 h-full animate-fade-in">
                  <Timer onSessionEnd={handleSessionEnd} />
                  {sessionDuration > 0 && (
                    <div className="mt-6 text-center">
                      <p className="text-text-muted text-xs">Session total</p>
                      <p className="text-accent font-mono text-lg mt-0.5">
                        {Math.floor(sessionDuration / 3600000)}h {Math.floor((sessionDuration % 3600000) / 60000)}m
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activePanel === 'ranks' && (
                <div className="flex flex-col h-full animate-fade-in">
                  <RoomLeaderboard participants={participants} currentUserId={currentUser.id} ownerId={initialRoom.ownerId} />
                </div>
              )}
              {activePanel === 'people' && (
                <div className="flex flex-col h-full animate-fade-in">
                  {peoplePanel}
                </div>
              )}
              {activePanel === 'chat' && (
                <div className="flex flex-col h-full animate-fade-in">
                  <ChatBox messages={messages} currentUser={currentUser} participants={participants} onSend={handleSendMessage} />
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 border-t border-border bg-bg-secondary">
              {mobileTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-all relative ${
                    activePanel === tab.id ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px]">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute top-1.5 right-[calc(50%-18px)] bg-accent text-bg-primary text-[9px] px-1 rounded-full leading-tight">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {pendingSessionMs !== null && (
        <SessionCompleteModal durationMs={pendingSessionMs} onConfirm={handleConfirmSession} />
      )}

      {/* Edit Room Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-sm border border-border animate-slide-up shadow-card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-primary font-semibold">Edit Room</h3>
              <button onClick={() => setShowEditModal(false)} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-elevated">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-text-muted text-xs uppercase tracking-wider block mb-2">Room Name</label>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-text-muted text-xs uppercase tracking-wider block mb-2">Focus Area</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setEditSubject(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        editSubject === s
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
                  Max Capacity: <span className="text-accent">{editCapacity}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={editCapacity}
                  onChange={e => setEditCapacity(Number(e.target.value))}
                  className="w-full accent-[#38bdf8]"
                />
                <div className="flex justify-between text-text-muted text-xs mt-1">
                  <span>2</span><span>20</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:border-accent/30 hover:text-text-secondary transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editName.trim().length < 3}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent text-bg-primary hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-xs border border-border animate-slide-up shadow-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-text-primary font-semibold mb-2">Delete Room?</h3>
            <p className="text-text-muted text-sm mb-6">This will remove the room for everyone. This can't be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:border-accent/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-500/90 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Room Confirmation (non-owner) */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-xs border border-border animate-slide-up shadow-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <LogOut size={20} className="text-orange-400" />
            </div>
            <h3 className="text-text-primary font-semibold mb-2">Leave Room?</h3>
            <p className="text-text-muted text-sm mb-6">This will remove the room from your list.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:border-accent/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onLeaveRoom}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-orange-500 text-white hover:bg-orange-500/90 transition-all"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
