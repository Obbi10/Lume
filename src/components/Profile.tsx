import { useState } from 'react';
import type { UserProfile } from '../types';
import AbstractAvatar from './AbstractAvatar';
import { generateArtSeed, generateArtColors } from '../utils/artGen';
import { ArrowLeft, RefreshCw, Plus, X, BookOpen, Edit3, Check } from 'lucide-react';

const SUBJECT_SUGGESTIONS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English Literature', 'History', 'Geography', 'Economics',
  'Computer Science', 'Psychology', 'French', 'Spanish',
  'Business Studies', 'Philosophy', 'Art', 'Music',
];

interface Props {
  profile: UserProfile;
  onBack: () => void;
  onUpdate: (profile: UserProfile) => void;
}

export default function Profile({ profile, onBack, onUpdate }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile.name);
  const [subjects, setSubjects] = useState<string[]>(profile.subjects);
  const [subjectInput, setSubjectInput] = useState('');
  const [seed, setSeed] = useState(profile.artSeed);
  const [colors, setColors] = useState(profile.artColors);
  const [isDirty, setIsDirty] = useState(false);

  const regenArt = () => {
    const s = generateArtSeed();
    const c = generateArtColors(s);
    setSeed(s);
    setColors(c);
    setIsDirty(true);
  };

  const addSubject = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed || subjects.includes(trimmed) || subjects.length >= 8) return;
    setSubjects(prev => [...prev, trimmed]);
    setSubjectInput('');
    setIsDirty(true);
  };

  const removeSubject = (s: string) => {
    setSubjects(prev => prev.filter(x => x !== s));
    setIsDirty(true);
  };

  const handleSaveName = () => {
    if (name.trim().length >= 2) {
      setEditingName(false);
      setIsDirty(true);
    }
  };

  const handleSave = () => {
    onUpdate({ ...profile, name: name.trim(), subjects, artSeed: seed, artColors: colors });
    setIsDirty(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-bg-elevated"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-text-primary font-semibold">Profile</span>
        {isDirty && (
          <button
            onClick={handleSave}
            className="ml-auto flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/90 transition-all glow-blue"
          >
            <Check size={14} />
            Save
          </button>
        )}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-6">
        {/* Avatar section */}
        <div className="glass rounded-2xl p-6 border border-border flex flex-col items-center gap-4">
          <div className="relative">
            <AbstractAvatar seed={seed} colors={colors} size={100} className="ring-2 ring-accent/30 glow-blue" />
          </div>

          <button
            onClick={regenArt}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors bg-bg-elevated border border-border px-4 py-2 rounded-full"
          >
            <RefreshCw size={13} />
            Regenerate avatar
          </button>

          {/* Colour palette preview */}
          <div className="flex gap-2">
            {colors.map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-border/50" style={{ background: c }} />
            ))}
          </div>
        </div>

        {/* Name section */}
        <div className="glass rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-xs uppercase tracking-wider">Display Name</span>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="text-text-muted hover:text-accent transition-colors"
              >
                <Edit3 size={13} />
              </button>
            )}
          </div>

          {editingName ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="flex-1 bg-bg-elevated border border-accent/30 rounded-xl px-4 py-2.5 text-text-primary text-sm focus:border-accent transition-colors"
              />
              <button
                onClick={handleSaveName}
                className="bg-accent/10 border border-accent/30 text-accent px-3 rounded-xl hover:bg-accent/20 transition-colors"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <p className="text-text-primary font-semibold text-lg">{name}</p>
          )}
        </div>

        {/* Subjects section */}
        <div className="glass rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={13} className="text-text-muted" />
            <span className="text-text-muted text-xs uppercase tracking-wider">Subjects</span>
            <span className="ml-auto text-text-muted text-xs">{subjects.length}/8</span>
          </div>

          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {subjects.map(s => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs px-3 py-1.5 rounded-full"
                >
                  {s}
                  <button onClick={() => removeSubject(s)} className="hover:text-white transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={subjectInput}
              onChange={e => setSubjectInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSubject(subjectInput); }}
              placeholder="Add a subject..."
              className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder-text-muted text-sm focus:border-accent/50 transition-colors"
            />
            <button
              onClick={() => addSubject(subjectInput)}
              className="bg-accent/10 border border-accent/30 text-accent rounded-xl px-3 hover:bg-accent/20 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUBJECT_SUGGESTIONS.filter(s => !subjects.includes(s)).slice(0, 8).map(s => (
              <button
                key={s}
                onClick={() => addSubject(s)}
                className="text-xs px-3 py-1 rounded-full bg-bg-elevated border border-border text-text-muted hover:border-accent/40 hover:text-accent transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
