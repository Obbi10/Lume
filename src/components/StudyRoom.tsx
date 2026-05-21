import { useState, useEffect, useCallback } from 'react';
import type { StudyRoom as StudyRoomType, UserProfile, ChatMessage, Participant } from '../types';
import Timer from './Timer';
import ChatBox from './ChatBox';
import ParticipantCard from './ParticipantCard';
import AbstractAvatar from './AbstractAvatar';
import { ArrowLeft, Users, MessageSquare, Clock } from 'lucide-react';

interface Props {
  room: StudyRoomType;
  currentUser: UserProfile;
  onLeave: () => void;
}

type Panel = 'timer' | 'chat' | 'people';

export default function StudyRoom({ room: initialRoom, currentUser, onLeave }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>('timer');
  const [messages, setMessages] = useState<ChatMessage[]>(initialRoom.messages);
  const [participants] = useState<Participant[]>(() => {
    const meAsParticipant: Participant = {
      id: currentUser.id,
      name: currentUser.name,
      subjects: currentUser.subjects,
      artSeed: currentUser.artSeed,
      artColors: currentUser.artColors,
      joinedAt: Date.now(),
      startedAt: Date.now(),
      isActive: true,
    };
    return [meAsParticipant, ...initialRoom.participants];
  });
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name.split(' ')[0],
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, [currentUser]);

  const handleSessionEnd = useCallback((durationMs: number) => {
    setSessionDuration(prev => prev + durationMs);
    const msg: ChatMessage = {
      id: `msg-sys-${Date.now()}`,
      userId: 'system',
      userName: 'lume',
      text: `${currentUser.name.split(' ')[0]} finished a session 🎉`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, [currentUser]);

  const tabs: { id: Panel; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'timer', label: 'Timer', icon: <Clock size={15} /> },
    { id: 'people', label: 'People', icon: <Users size={15} />, badge: participants.length },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={15} />, badge: messages.filter(m => m.userId !== 'system').length },
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onLeave}
          className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-bg-elevated"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-text-primary font-semibold text-sm truncate">{initialRoom.name}</h2>
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full live-dot inline-block" />
            <span>{participants.length} studying now</span>
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

      {/* Desktop: side-by-side layout */}
      <div className="flex-1 flex overflow-hidden">
        {!isMobile ? (
          <>
            {/* Left: Timer */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-border">
              <div className="w-full max-w-sm">
                <h3 className="text-text-muted text-xs uppercase tracking-widest mb-6 text-center">Focus Timer</h3>
                <Timer onSessionEnd={handleSessionEnd} />
                {sessionDuration > 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-text-muted text-xs">Total session today</p>
                    <p className="text-accent font-mono text-lg mt-0.5">
                      {Math.floor(sessionDuration / 3600000)}h {Math.floor((sessionDuration % 3600000) / 60000)}m
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: People + Chat stacked */}
            <div className="w-72 flex flex-col">
              {/* People */}
              <div className="border-b border-border p-3 flex-shrink-0" style={{ maxHeight: '50%', overflowY: 'auto' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={12} className="text-text-muted" />
                  <span className="text-text-muted text-xs uppercase tracking-wider">Studying</span>
                  <span className="ml-auto text-accent text-xs bg-accent/10 px-2 py-0.5 rounded-full">{participants.length}</span>
                </div>
                <div className="space-y-1">
                  {participants.map(p => (
                    <ParticipantCard key={p.id} participant={p} isCurrentUser={p.id === currentUser.id} />
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 p-3 border-b border-border flex-shrink-0">
                  <MessageSquare size={12} className="text-text-muted" />
                  <span className="text-text-muted text-xs uppercase tracking-wider">Chat</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ChatBox messages={messages} currentUser={currentUser} onSend={handleSendMessage} />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Mobile: tabbed layout */
          <div className="flex-1 flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-border bg-bg-secondary">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all relative ${
                    activePanel === tab.id
                      ? 'text-accent'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="bg-accent/20 text-accent text-[9px] px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                  )}
                  {activePanel === tab.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'timer' && (
                <div className="flex flex-col items-center justify-center p-8 h-full animate-fade-in">
                  <Timer onSessionEnd={handleSessionEnd} />
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
    </div>
  );
}
