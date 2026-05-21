import type { Participant, StudyRoom, ChatMessage, LeaderboardEntry } from '../types';

const NAMES = [
  'Aria Chen', 'Marcus Webb', 'Zoe Patel', 'Liam Torres', 'Nadia Osei',
  'Finn Larsen', 'Priya Nair', 'Ethan Brooks', 'Sofia Rossi', 'Kai Yamamoto',
];

const SUBJECT_SETS = [
  ['Mathematics', 'Physics'],
  ['Biology', 'Chemistry'],
  ['History', 'English Literature'],
  ['Computer Science', 'Mathematics'],
  ['Economics', 'Business Studies'],
  ['Psychology', 'Sociology'],
  ['Art', 'Design'],
  ['French', 'Spanish'],
];

const ROOM_DATA = [
  { name: 'Deep Work Zone', subject: 'Mixed' },
  { name: 'STEM Focus', subject: 'Sciences' },
  { name: 'Humanities Hub', subject: 'Humanities' },
  { name: 'Exam Grind', subject: 'Mixed' },
  { name: 'Chill Study', subject: 'Relaxed' },
  { name: 'Late Night Session', subject: 'Mixed' },
];

const CHAT_SAMPLES = [
  'good luck everyone 🔥',
  'on my third pomodoro, feeling it',
  'anyone else doing calculus rhs?',
  'this chapter is brutal',
  'just got a coffee, back at it',
  'focusing on essay drafts',
  'trying not to open twitter lol',
  'math exam tomorrow, need to grind',
  'two more hours and im done',
  'stay strong 💪',
];

function seededCode(rand: () => number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(rand() * chars.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMockLeaderboard(): LeaderboardEntry[] {
  const rand = seededRng(99);
  const palettes = [
    ['#38bdf8', '#818cf8', '#0f172a'],
    ['#22d3ee', '#06b6d4', '#164e63'],
    ['#a78bfa', '#38bdf8', '#1e1b4b'],
    ['#34d399', '#38bdf8', '#064e3b'],
    ['#f472b6', '#818cf8', '#1e1b4b'],
    ['#fb923c', '#fbbf24', '#7c2d12'],
    ['#38bdf8', '#0ea5e9', '#082f49'],
    ['#e879f9', '#a78bfa', '#2e1065'],
    ['#4ade80', '#22d3ee', '#052e16'],
    ['#f87171', '#fb923c', '#450a0a'],
  ];

  return NAMES.map((name, i) => {
    const seed = Math.floor(rand() * 1000);
    const colors = palettes[seed % palettes.length];
    const subjects = SUBJECT_SETS[i % SUBJECT_SETS.length];

    // Generate realistic-feeling revision hours
    const weeklyHours = 2 + rand() * 28;
    const monthlyHours = weeklyHours * 3.5 + rand() * 20;
    const totalHours = monthlyHours * 5 + rand() * 200;

    return {
      id: `lb-${i}`,
      name,
      artSeed: seed,
      artColors: colors,
      subjects,
      weeklyMs: Math.round(weeklyHours * 3600000),
      monthlyMs: Math.round(monthlyHours * 3600000),
      totalMs: Math.round(totalHours * 3600000),
    };
  });
}

export function generateMockRooms(): StudyRoom[] {
  const now = Date.now();
  const rand = seededRng(42);

  return ROOM_DATA.map((r, ri) => {
    const participantCount = 2 + Math.floor(rand() * 5);
    const participants: Participant[] = [];
    const usedNames = new Set<number>();

    for (let i = 0; i < participantCount; i++) {
      let nameIdx = Math.floor(rand() * NAMES.length);
      while (usedNames.has(nameIdx)) nameIdx = (nameIdx + 1) % NAMES.length;
      usedNames.add(nameIdx);

      const subjectSet = SUBJECT_SETS[Math.floor(rand() * SUBJECT_SETS.length)];
      const seed = Math.floor(rand() * 1000);
      const palettes = [
        ['#38bdf8', '#818cf8', '#0f172a'],
        ['#22d3ee', '#06b6d4', '#164e63'],
        ['#a78bfa', '#38bdf8', '#1e1b4b'],
        ['#34d399', '#38bdf8', '#064e3b'],
        ['#f472b6', '#818cf8', '#1e1b4b'],
      ];
      const colors = palettes[seed % palettes.length];
      const startedAgo = Math.floor(rand() * 7200000);
      const weeklyHours = 2 + rand() * 28;
      const monthlyHours = weeklyHours * 3.5 + rand() * 20;
      const totalHours = monthlyHours * 5 + rand() * 200;

      participants.push({
        id: `mock-${ri}-${i}`,
        name: NAMES[nameIdx],
        subjects: subjectSet,
        artSeed: seed,
        artColors: colors,
        joinedAt: now - startedAgo - 60000,
        startedAt: now - startedAgo,
        isActive: true,
        weeklyMs: Math.round(weeklyHours * 3600000),
        monthlyMs: Math.round(monthlyHours * 3600000),
        totalMs: Math.round(totalHours * 3600000),
      });
    }

    const messages: ChatMessage[] = [];
    const msgCount = 3 + Math.floor(rand() * 8);
    for (let m = 0; m < msgCount; m++) {
      const sender = participants[Math.floor(rand() * participants.length)];
      messages.push({
        id: `msg-${ri}-${m}`,
        userId: sender.id,
        userName: sender.name.split(' ')[0],
        text: CHAT_SAMPLES[Math.floor(rand() * CHAT_SAMPLES.length)],
        timestamp: now - Math.floor(rand() * 1800000),
      });
    }

    messages.sort((a, b) => a.timestamp - b.timestamp);

    return {
      id: `room-${ri}`,
      name: r.name,
      subject: r.subject,
      code: seededCode(rand),
      participants,
      maxCapacity: 10,
      messages,
      createdAt: now - Math.floor(rand() * 86400000),
    };
  });
}
