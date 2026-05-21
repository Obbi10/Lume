import { useState, useCallback, useEffect } from 'react';
import type { View, UserProfile, StudyRoom } from './types';
import Onboarding from './components/Onboarding';
import RoomList from './components/RoomList';
import StudyRoomComponent from './components/StudyRoom';
import Profile from './components/Profile';
import CreateRoomModal from './components/CreateRoomModal';

const PROFILE_KEY = 'lume_profile';
const TODAY_KEY   = 'lume_today';

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
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

export default function App() {
  const [view, setView]         = useState<View>(() => loadProfile() ? 'rooms' : 'onboarding');
  const [profile, setProfile]   = useState<UserProfile | null>(loadProfile);
  const [rooms, setRooms]       = useState<StudyRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [todayMs, setTodayMs]   = useState<number>(loadTodayMs);

  // Keep localStorage in sync
  useEffect(() => { if (profile) saveProfile(profile); }, [profile]);
  useEffect(() => { saveTodayMs(todayMs); }, [todayMs]);

  const handleOnboardingComplete = useCallback((p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setView('rooms');
  }, []);

  const handleJoinRoom = useCallback((room: StudyRoom) => {
    setActiveRoom(room);
    setView('room');
  }, []);

  const handleJoinByCode = useCallback((code: string): boolean => {
    const normalized = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const room = rooms.find(r => r.code.replace('-', '') === normalized);
    if (!room) return false;
    setActiveRoom(room);
    setView('room');
    return true;
  }, [rooms]);

  const handleLeaveRoom = useCallback(() => {
    setActiveRoom(null);
    setView('rooms');
  }, []);

  // Fired each time the user confirms a session complete modal
  const handleSessionConfirmed = useCallback((ms: number) => {
    setTodayMs(prev => prev + ms);
    setProfile(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        weeklyMs:  prev.weeklyMs  + ms,
        monthlyMs: prev.monthlyMs + ms,
        totalMs:   prev.totalMs   + ms,
      };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const handleCreateRoom = useCallback((roomData: Omit<StudyRoom, 'participants' | 'messages' | 'createdAt'>) => {
    const newRoom: StudyRoom = {
      ...roomData,
      participants: [],
      messages: [],
      createdAt: Date.now(),
    };
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoom(newRoom);
    setShowCreateModal(false);
    setView('room');
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
        />
      )}

      {view === 'room' && activeRoom && (
        <StudyRoomComponent
          room={activeRoom}
          currentUser={profile}
          onLeave={handleLeaveRoom}
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
