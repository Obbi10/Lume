import { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatMessage, UserProfile, Participant } from '../types';
import { formatTimeAgo } from '../utils/time';
import { Send } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  currentUser: UserProfile;
  participants: Participant[];
  onSend: (text: string) => void;
}

export default function ChatBox({ messages, currentUser, participants, onSend }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const colorMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of participants) {
      map[p.id] = p.artColors;
    }
    map[currentUser.id] = currentUser.artColors;
    return map;
  }, [participants, currentUser]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3 min-h-0">
        {messages.map(msg => {
          const isOwn = msg.userId === currentUser.id;
          const isSystem = msg.userId === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span className="text-text-muted text-[10px] italic bg-bg-elevated/60 border border-border px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          const colors = colorMap[msg.userId] || (isOwn ? currentUser.artColors : ['#38bdf8', '#818cf8', '#0f172a']);
          const primaryColor = colors[0];

          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {!isOwn && (
                <span
                  className="text-xs mb-0.5 ml-1 font-medium"
                  style={{ color: primaryColor }}
                >
                  {msg.userName}
                </span>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
                }`}
                style={
                  isOwn
                    ? { backgroundColor: primaryColor, color: '#0d1117' }
                    : {
                        backgroundColor: primaryColor + '22',
                        border: `1px solid ${primaryColor}44`,
                        color: 'inherit',
                      }
                }
              >
                {msg.text}
              </div>
              <span className="text-text-muted text-[10px] mt-0.5 mx-1">
                {formatTimeAgo(msg.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-2">
        <div className="flex gap-2 items-center bg-bg-elevated border border-border rounded-xl px-3 py-2 focus-within:border-accent/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Message the room..."
            className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-xs"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="text-accent hover:text-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
