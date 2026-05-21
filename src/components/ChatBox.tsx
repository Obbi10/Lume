import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, UserProfile } from '../types';
import { formatTimeAgo } from '../utils/time';
import { Send } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  currentUser: UserProfile;
  onSend: (text: string) => void;
}

export default function ChatBox({ messages, currentUser, onSend }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {!isOwn && (
                <span className="text-text-muted text-xs mb-0.5 ml-1">{msg.userName}</span>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  isOwn
                    ? 'bg-accent text-bg-primary rounded-br-sm'
                    : 'bg-bg-elevated border border-border text-text-secondary rounded-bl-sm'
                }`}
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
