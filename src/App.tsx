import { useState, useCallback } from 'react';
import type { View, UserProfile, StudyRoom } from './types';
import { generateMockRooms } from './utils/mockData';
import Onboarding from './components/Onboarding';
import RoomList from './components/RoomList';
import StudyRoomComponent from './components/StudyRoom';
import Profile from './components/Profile';
import CreateRoomModal from './components/CreateRoomModal';

export default function App() {
  const [view, setView] = useState<View>('onboarding');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>(generateMockRooms());
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleOnboardingComplete = useCallback((p: UserProfile) => {
    setProfile(p);
    setView('rooms');
  }, []);

  const handleJoinRoom = useCallback((room: StudyRoom) => {
    setActiveRoom(room);
    setView('room');
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setActiveRoom(null);
    setView('rooms');
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
    setView('room');
  }, []);

  const handleUpdateProfile = useCallback((updated: UserProfile) => {
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
          onJoin={handleJoinRoom}
          onViewProfile={() => setView('profile')}
          onCreateRoom={() => setShowCreateModal(true)}
        />
      )}

      {view === 'room' && activeRoom && (
        <StudyRoomComponent
          room={activeRoom}
          currentUser={profile}
          onLeave={handleLeaveRoom}
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
