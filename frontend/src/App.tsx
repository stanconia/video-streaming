import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { RoomList } from './components/Room/RoomList';
import { CreateRoom } from './components/Room/CreateRoom';
import { BroadcasterView } from './components/Broadcaster/BroadcasterView';
import { ViewerView } from './components/Viewer/ViewerView';

function HomePage() {
  const navigate = useNavigate();
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const handleRoomCreated = (roomId: string) => {
    // After creating a room, navigate to broadcaster view
    navigate(`/room/${roomId}/broadcast`);
  };

  const handleJoinRoom = (roomId: string, role: 'broadcaster' | 'viewer') => {
    if (role === 'broadcaster') {
      navigate(`/room/${roomId}/broadcast`);
    } else {
      navigate(`/room/${roomId}/view`);
    }
  };

  return (
    <div style={styles.homePage}>
      <header style={styles.header}>
        <h1>Video Streaming Platform</h1>
        <p>Broadcast and watch live video streams</p>
      </header>

      <div style={styles.actions}>
        <button onClick={() => setShowCreateRoom(!showCreateRoom)} style={styles.primaryButton}>
          {showCreateRoom ? 'Hide Create Room' : 'Create New Room'}
        </button>
      </div>

      {showCreateRoom && (
        <div style={styles.createRoomSection}>
          <CreateRoom onRoomCreated={handleRoomCreated} />
        </div>
      )}

      <RoomList onJoinRoom={handleJoinRoom} />
    </div>
  );
}

function BroadcastPage() {
  const navigate = useNavigate();
  const [roomId] = useState(() => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.indexOf('room') + 1];
  });
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);

  const handleLeave = () => {
    navigate('/');
  };

  return <BroadcasterView roomId={roomId} userId={userId} onLeave={handleLeave} />;
}

function ViewPage() {
  const navigate = useNavigate();
  const [roomId] = useState(() => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.indexOf('room') + 1];
  });
  const [userId] = useState(() => `viewer-${Math.random().toString(36).substr(2, 9)}`);

  const handleLeave = () => {
    navigate('/');
  };

  return <ViewerView roomId={roomId} userId={userId} onLeave={handleLeave} />;
}

function App() {
  return (
    <Router>
      <div style={styles.app}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId/broadcast" element={<BroadcastPage />} />
          <Route path="/room/:roomId/view" element={<ViewPage />} />
        </Routes>
      </div>
    </Router>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
  },
  homePage: {
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  actions: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  primaryButton: {
    padding: '15px 30px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  createRoomSection: {
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};

export default App;
