import { useState } from 'react';
import type { UserProfile } from '../types';
import { generateArtSeed, generateArtColors } from '../utils/artGen';
import AbstractAvatar from './AbstractAvatar';
import LumeLogo from './LumeLogo';
import { Plus, X, ArrowRight } from 'lucide-react';

const SUBJECT_SUGGESTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English Literature', 'History', 'Geography', 'Economics',
  'Computer Science', 'Psychology', 'French', 'Spanish',
  'Business Studies', 'Philosophy', 'Art', 'Music',
];

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [seed] = useState(() => generateArtSeed());
  const [colors] = useState(() => generateArtColors(seed));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const addSubject = (subj: string) => {
    const trimmed = subj.trim();
    if (!trimmed || subjects.includes(trimmed) || subjects.length >= 8) return;
    setSubjects(prev => [...prev, trimmed]);
    setSubjectInput('');
  };

  const removeSubject = (s: string) => setSubjects(prev => prev.filter(x => x !== s));

  const handleNext = () => {
    if (step === 0) {
      if (name.trim().length < 2) { setError('Please enter your name'); return; }
      setError('');
      setStep(1);
    } else if (step === 1) {
      if (subjects.length === 0) { setError('Add at least one subject'); return; }
      setError('');
      setStep(2);
    } else {
      onComplete({
        id: `user-${Date.now()}`,
        name: name.trim(),
        subjects,
        artSeed: seed,
        artColors: colors,
        joinedAt: Date.now(),
        streak: 1,
        weeklyMs: 0,
        monthlyMs: 0,
        totalMs: 0,
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <LumeLogo size={56} showText textClassName="text-4xl mt-1" />
          <p className="text-text-muted text-sm mt-2">study together, stay focused</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Steps indicator */}
          <div className="flex gap-2 mb-8">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-accent' : 'bg-border'}`}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-text-primary text-xl font-semibold mb-1">What's your name?</h2>
              <p className="text-text-muted text-sm mb-6">This is how others will see you in study rooms</p>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder="Your name..."
                className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent transition-colors text-sm"
              />
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-text-primary text-xl font-semibold mb-1">What do you study?</h2>
              <p className="text-text-muted text-sm mb-4">Add your subjects (up to 8)</p>

              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  type="text"
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSubject(subjectInput); }}
                  placeholder="Type a subject..."
                  className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent transition-colors text-sm"
                />
                <button
                  onClick={() => addSubject(subjectInput)}
                  className="bg-accent/10 border border-accent/30 text-accent rounded-xl px-3 hover:bg-accent/20 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {subjects.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-accent/10 border border-accent/20 text-accent text-xs px-3 py-1.5 rounded-full">
                      {s}
                      <button onClick={() => removeSubject(s)} className="hover:text-white transition-colors ml-0.5">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_SUGGESTIONS.filter(s => !subjects.includes(s)).slice(0, 8).map(s => (
                  <button
                    key={s}
                    onClick={() => addSubject(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-bg-elevated border border-border text-text-secondary hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-text-primary text-xl font-semibold mb-1">Your avatar</h2>
              <p className="text-text-muted text-sm mb-6">Unique abstract art, just for you</p>

              <div className="flex flex-col items-center gap-4">
                <AbstractAvatar seed={seed} colors={colors} size={120} className="ring-2 ring-accent/30 glow-blue" />
                <p className="text-text-muted text-xs text-center">This is your unique avatar — no two are alike</p>
                <div className="text-center">
                  <p className="text-text-primary font-medium">{name}</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {subjects.map(s => (
                      <span key={s} className="text-xs text-accent/70 bg-accent/5 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs mt-3">{error}</p>
          )}

          <button
            onClick={handleNext}
            className="w-full mt-6 bg-accent text-bg-primary font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-all glow-blue hover:glow-blue-lg"
          >
            {step === 2 ? 'Enter Lume' : 'Continue'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
