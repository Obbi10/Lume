import type { Participant, StudyRoom, ChatMessage } from '../types';

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

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
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

      participants.push({
        id: `mock-${ri}-${i}`,
        name: NAMES[nameIdx],
        subjects: subjectSet,
        artSeed: seed,
        artColors: colors,
        joinedAt: now - startedAgo - 60000,
        startedAt: now - startedAgo,
        isActive: true,
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
      participants,
      maxCapacity: 10,
      messages,
      createdAt: now - Math.floor(rand() * 86400000),
    };
  });
}
