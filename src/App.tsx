import { useState, useCallback, useEffect } from 'react';
import type { View, UserProfile, StudyRoom } from './types';
import { decodeShareCode } from './utils/roomCode';
import Onboarding from './components/Onboarding';
import RoomList from './components/RoomList';
import StudyRoomComponent from './components/StudyRoom';
import Profile from './components/Profile';
import CreateRoomModal from './components/CreateRoomModal';

const PROFILE_KEY = 'lume_profile';
const TODAY_KEY   = 'lume_today';
const ROOMS_KEY   = 'lume_rooms';

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as UserProfile;
    // Sanitize: guard against undefined/NaN from profiles saved before stats fields existed
    return {
      ...p,
      streak:    (Number.isFinite(p.streak)    && p.streak    >= 0) ? p.streak    : 1,
      weeklyMs:  (Number.isFinite(p.weeklyMs)  && p.weeklyMs  >= 0) ? p.weeklyMs  : 0,
      monthlyMs: (Number.isFinite(p.monthlyMs) && p.monthlyMs >= 0) ? p.monthlyMs : 0,
      totalMs:   (Number.isFinite(p.totalMs)   && p.totalMs   >= 0) ? p.totalMs   : 0,
    };
  } catch { return null; }
}

function saveProfile(p: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function loadTodayMs(): number {
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (!raw) return 0;
    const { date, ms } = JSON.parse(raw) as { date: string; ms: number };
    return date === new Date().toDateString() ? ms : 0;
  } catch { return 0; }
}

function saveTodayMs(ms: number) {
  localStorage.setItem(TODAY_KEY, JSON.stringify({ date: new Date().toDateString(), ms }));
}

function loadRooms(): StudyRoom[] {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    return raw ? (JSON.parse(raw) as StudyRoom[]) : [];
  } catch { return []; }
}

function saveRooms(rooms: StudyRoom[]) {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export default function App() {
  const [view, setView]         = useState<View>(() => loadProfile() ? 'rooms' : 'onboarding');
  const [profile, setProfile]   = useState<UserProfile | null>(loadProfile);
  const [rooms, setRooms]       = useState<StudyRoom[]>(loadRooms);
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [todayMs, setTodayMs]   = useState<number>(loadTodayMs);

  // Keep localStorage in sync
  useEffect(() => { if (profile) saveProfile(profile); }, [profile]);
  useEffect(() => { saveTodayMs(todayMs); }, [todayMs]);
  useEffect(() => { saveRooms(rooms); }, [rooms]);

  const handleOnboardingComplete = useCallback((p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setView('rooms');
  }, []);

  const handleJoinRoom = useCallback((room: StudyRoom) => {
    setActiveRoom(room);
    setView('room');
  }, []);

  const handleJoinByCode = useCallback((input: string): boolean => {
    const trimmed = input.trim();

    // 1. Try local rooms by short code (creator on same device)
    const normalized = trimmed.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const local = rooms.find(r => r.code.replace('-', '') === normalized);
    if (local) { setActiveRoom(local); setView('room'); return true; }

    // 2. Try to decode a share code so anyone can join from another device
    const decoded = decodeShareCode(trimmed);
    if (decoded) {
      // Re-use if we already have this room locally
      const existing = rooms.find(r => r.code === decoded.code);
      if (existing) { setActiveRoom(existing); setView('room'); return true; }

      // Otherwise create a local copy from the encoded metadata
      const newRoom: StudyRoom = {
        id: `room-${Date.now()}`,
        name: decoded.name,
        subject: decoded.subject,
        code: decoded.code,
        ownerId: '',
        participants: [],
        messages: [],
        maxCapacity: decoded.maxCapacity,
        createdAt: Date.now(),
      };
      setRooms(prev => [...prev, newRoom]);
      setActiveRoom(newRoom);
      setView('room');
      return true;
    }

    return false;
  }, [rooms]);

  const handleLeaveRoom = useCallback(() => {
    setActiveRoom(null);
    setView('rooms');
  }, []);

  // Fired each time the user confirms a session complete modal
  const handleSessionConfirmed = useCallback((ms: number) => {
    if (!Number.isFinite(ms) || ms <= 0) return;
    setTodayMs(prev => prev + ms);
    setProfile(prev => {
      if (!prev) return prev;
      const safe = (v: number) => (Number.isFinite(v) && v >= 0 ? v : 0);
      const updated = {
        ...prev,
        weeklyMs:  safe(prev.weeklyMs)  + ms,
        monthlyMs: safe(prev.monthlyMs) + ms,
        totalMs:   safe(prev.totalMs)   + ms,
      };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const handleCreateRoom = useCallback((roomData: Omit<StudyRoom, 'participants' | 'messages' | 'createdAt' | 'ownerId'>) => {
    const newRoom: StudyRoom = {
      ...roomData,
      ownerId: profile!.id,
      participants: [],
      messages: [],
      createdAt: Date.now(),
    };
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoom(newRoom);
    setShowCreateModal(false);
    setView('room');
  }, [profile]);

  const handleLeaveRoomExplicitly = useCallback(() => {
    if (!activeRoom) return;
    setRooms(prev => prev.filter(r => r.id !== activeRoom.id));
    setActiveRoom(null);
    setView('rooms');
  }, [activeRoom]);

  const handleDeleteRoom = useCallback(() => {
    if (!activeRoom) return;
    setRooms(prev => prev.filter(r => r.id !== activeRoom.id));
    setActiveRoom(null);
    setView('rooms');
  }, [activeRoom]);

  const handleUpdateRoom = useCallback((updates: { name: string; subject: string; maxCapacity: number }) => {
    if (!activeRoom) return;
    const updated = { ...activeRoom, ...updates };
    setRooms(prev => prev.map(r => r.id === activeRoom.id ? updated : r));
    setActiveRoom(updated);
  }, [activeRoom]);

  const handleLeaveRoomFromList = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  }, []);

  const handleUpdateProfile = useCallback((updated: UserProfile) => {
    saveProfile(updated);
    setProfile(updated);
  }, []);

  if (view === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!profile) return null;

  return (
    <>
      {view === 'rooms' && (
        <RoomList
          rooms={rooms}
          currentUser={profile}
          todayMs={todayMs}
          onJoin={handleJoinRoom}
          onJoinByCode={handleJoinByCode}
          onViewProfile={() => setView('profile')}
          onCreateRoom={() => setShowCreateModal(true)}
          onLeaveRoom={handleLeaveRoomFromList}
        />
      )}

      {view === 'room' && activeRoom && (
        <StudyRoomComponent
          room={activeRoom}
          currentUser={profile}
          onLeave={handleLeaveRoom}
          onLeaveRoom={handleLeaveRoomExplicitly}
          onDeleteRoom={handleDeleteRoom}
          onUpdateRoom={handleUpdateRoom}
          onSessionConfirmed={handleSessionConfirmed}
        />
      )}

      {view === 'profile' && (
        <Profile
          profile={profile}
          onBack={() => setView('rooms')}
          onUpdate={handleUpdateProfile}
        />
      )}

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </>
  );
}
