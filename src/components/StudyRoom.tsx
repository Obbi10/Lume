import { useState, useEffect, useCallback } from 'react';
import type { StudyRoom as StudyRoomType, UserProfile, ChatMessage, Participant } from '../types';
import { db } from '../firebase';
import { ref, set, update, remove, push, onValue, onDisconnect } from 'firebase/database';
import Timer from './Timer';
import ChatBox from './ChatBox';
import ParticipantCard from './ParticipantCard';
import AbstractAvatar from './AbstractAvatar';
import SessionCompleteModal from './SessionCompleteModal';
import { ArrowLeft, Users, MessageSquare, Clock, Trophy } from 'lucide-react';
import { formatShortDuration } from '../utils/time';

interface Props {
  room: StudyRoomType;
  currentUser: UserProfile;
  onLeave: () => void;
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
}: {
  participants: Participant[];
  currentUserId: string;
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

export default function StudyRoom({ room: initialRoom, currentUser, onLeave, onSessionConfirmed }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>('timer');
  const [rightTab, setRightTab] = useState<RightTab>('people');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [pendingSessionMs, setPendingSessionMs] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const roomCode = initialRoom.code;

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
    set(pRef, me).catch(console.error);
    onDisconnect(pRef).remove(); // clean up if tab closes unexpectedly
    return () => { remove(pRef).catch(console.error); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live participants feed
  useEffect(() => {
    const pRef = ref(db, `rooms/${roomCode}/participants`);
    return onValue(pRef, (snap) => {
      const data = snap.val();
      setParticipants(data ? (Object.values(data) as Participant[]) : []);
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

    // Update own stats in Firebase — the live listener propagates the change to all devices
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

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
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

      <div className="flex-1 flex overflow-hidden">
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
                  <div className="p-2 overflow-y-auto h-full animate-fade-in">
                    <div className="space-y-0.5">
                      {participants.map(p => (
                        <ParticipantCard key={p.id} participant={p} isCurrentUser={p.id === currentUser.id} />
                      ))}
                    </div>
                  </div>
                )}
                {rightTab === 'ranks' && (
                  <div className="flex flex-col h-full animate-fade-in">
                    <RoomLeaderboard participants={participants} currentUserId={currentUser.id} />
                  </div>
                )}
                {rightTab === 'chat' && (
                  <div className="flex flex-col h-full animate-fade-in">
                    <ChatBox messages={messages} currentUser={currentUser} onSend={handleSendMessage} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex border-b border-border bg-bg-secondary">
              {mobileTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-all relative ${
                    activePanel === tab.id ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden xs:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="bg-accent/20 text-accent text-[9px] px-1 py-0.5 rounded-full">{tab.badge}</span>
                  )}
                  {activePanel === tab.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {activePanel === 'timer' && (
                <div className="flex flex-col items-center justify-center p-8 h-full animate-fade-in">
                  <Timer onSessionEnd={handleSessionEnd} />
                </div>
              )}
              {activePanel === 'ranks' && (
                <div className="flex flex-col h-full animate-fade-in">
                  <RoomLeaderboard participants={participants} currentUserId={currentUser.id} />
                </div>
              )}
              {activePanel === 'people' && (
                <div className="p-4 overflow-y-auto h-full animate-fade-in">
                  <div className="space-y-1">
                    {participants.map(p => (
                      <ParticipantCard key={p.id} participant={p} isCurrentUser={p.id === currentUser.id} />
                    ))}
                  </div>
                </div>
              )}
              {activePanel === 'chat' && (
                <div className="flex flex-col h-full animate-fade-in">
                  <ChatBox messages={messages} currentUser={currentUser} onSend={handleSendMessage} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {pendingSessionMs !== null && (
        <SessionCompleteModal durationMs={pendingSessionMs} onConfirm={handleConfirmSession} />
      )}
    </div>
  );
}
