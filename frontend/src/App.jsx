import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, User, MessageCircle, Hash, LogOut, Search, Plus, Bell, Settings, MoreVertical, X, Info } from 'lucide-react';

const socket = io('http://localhost:5003');

const INITIAL_CHANNELS = [
  { id: 'global', name: 'global-discussion', icon: Hash, desc: 'Public channel for everyone' },
  { id: 'dev', name: 'development', icon: Hash, desc: 'Technical talks and bugs' },
  { id: 'marketing', name: 'marketing', icon: Hash, desc: 'Strategy and growth' },
  { id: 'random', name: 'random', icon: Hash, desc: 'Non-work related banter' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Welcome!', desc: 'Welcome to your new Prodigy workspace.', time: 'Just now', type: 'info' },
  { id: 2, title: 'Pro Tip', desc: 'You can create new channels using the + icon.', time: '2m ago', type: 'info' }
];

function App() {
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [activeRoom, setActiveRoom] = useState('global');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  
  const messagesEndRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    socket.emit('join_room', activeRoom);
    axios.get(`http://localhost:5003/api/messages/${activeRoom}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));

    const handleMessage = (data) => {
      if (data.room === activeRoom) {
        setMessages((prev) => [...prev, data]);
      } else {
        // Add to notifications if message is in another room
        setNotifications(prev => [{
          id: Date.now(),
          title: `New message in #${data.room}`,
          desc: `${data.sender}: ${data.text.substring(0, 20)}...`,
          time: 'Now',
          type: 'message'
        }, ...prev]);
      }
    };

    socket.on('receive_message', handleMessage);
    return () => socket.off('receive_message', handleMessage);
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && username) {
      socket.emit('send_message', { sender: username, text: message, room: activeRoom });
      setMessage('');
    }
  };

  const handleJoinChat = (e) => {
    e.preventDefault();
    if (tempUsername.trim()) setUsername(tempUsername);
  };

  const handleAddChannel = (e) => {
    e.preventDefault();
    if (newChannelName.trim()) {
      const id = newChannelName.toLowerCase().replace(/\s+/g, '-');
      if (!channels.find(c => c.id === id)) {
        const newChannel = { id, name: newChannelName, icon: Hash, desc: 'User created channel' };
        setChannels([...channels, newChannel]);
        setActiveRoom(id);
        setNotifications(prev => [{
          id: Date.now(),
          title: 'Channel Created',
          desc: `You created and joined #${newChannelName}`,
          time: 'Just now',
          type: 'info'
        }, ...prev]);
      }
      setNewChannelName('');
      setShowAddModal(false);
    }
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!username) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="chat-sidebar" style={{ width: '400px', height: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)', width: '72px', height: '72px', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <MessageCircle size={36} color="white" />
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Prodigy Chat</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Connect with your team in real-time</p>
          </div>
          <form onSubmit={handleJoinChat}>
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Username..." 
              style={{ width: '100%', background: 'var(--surface-light)', borderRadius: '1rem', padding: '1.25rem 1rem', border: '1px solid var(--border)', marginBottom: '1.5rem', color: 'white' }}
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
            />
            <button type="submit" className="btn-send" style={{ width: '100%', padding: '1.25rem', fontWeight: 700 }}>Join Workspace</button>
          </form>
        </div>
      </div>
    );
  }

  const activeChannelInfo = channels.find(c => c.id === activeRoom);

  return (
    <div className="chat-container">
      {/* Add Channel Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="chat-sidebar" style={{ width: '400px', height: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create Channel</h2>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>
            <form onSubmit={handleAddChannel}>
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Channel name (e.g. general)" 
                style={{ width: '100%', background: 'var(--surface-light)', borderRadius: '1rem', padding: '1rem', border: '1px solid var(--border)', marginBottom: '1rem', color: 'white' }}
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-send" style={{ width: '100%', padding: '1rem', fontWeight: 700 }}>Create</button>
            </form>
          </div>
        </div>
      )}

      <aside className="chat-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={18} color="white" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Workspace</h2>
          </div>
          
          <div ref={notificationRef}>
            <div 
              style={{ position: 'relative', cursor: 'pointer' }} 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} color={showNotifications ? 'var(--primary)' : 'var(--text-secondary)'} />
              {notifications.length > 0 && (
                <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--surface)' }}></div>
              )}
            </div>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                width: '300px', 
                background: 'var(--surface-light)', 
                borderRadius: '1rem', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', 
                zIndex: 50,
                marginTop: '1rem',
                border: '1px solid var(--border)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Recent Activity</span>
                  <button 
                    onClick={() => setNotifications([])} 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', cursor: 'default' }}>
                        <div style={{ background: 'var(--surface)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {n.type === 'message' ? <MessageCircle size={16} color="var(--primary)" /> : <Info size={16} color="var(--accent)" />}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{n.title}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.125rem 0' }}>{n.desc}</p>
                          <p style={{ fontSize: '0.625rem', opacity: 0.6 }}>{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search channels..." 
            style={{ width: '100%', background: 'var(--surface-light)', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 1rem 0.75rem 2.75rem', color: 'var(--text)', fontSize: '0.875rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channels</p>
            <Plus size={16} color="var(--text-secondary)" style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(true)} />
          </div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            {filteredChannels.map(channel => (
              <div 
                key={channel.id} 
                className={`user-badge ${activeRoom === channel.id ? 'active-room' : ''}`}
                onClick={() => setActiveRoom(channel.id)}
                style={{ cursor: 'pointer' }}
              >
                <Hash size={18} />
                <span style={{ fontWeight: activeRoom === channel.id ? 700 : 500 }}>{channel.name}</span>
              </div>
            ))}
            {filteredChannels.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>No channels found</p>}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <div className="user-badge" style={{ padding: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '42px', height: '42px', background: 'var(--surface-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--primary)' }}>
                <User size={22} color="var(--primary)" />
              </div>
              <div className="status-dot" style={{ position: 'absolute', bottom: 2, right: 2 }}></div>
            </div>
            <div style={{ flex: 1, marginLeft: '0.75rem' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{username}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Available</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Settings size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
              <LogOut size={18} color="var(--danger)" style={{ cursor: 'pointer' }} onClick={() => setUsername('')} />
            </div>
          </div>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={24} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{activeChannelInfo?.name || activeRoom}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{activeChannelInfo?.desc || 'User created channel'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <MoreVertical size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
          </div>
        </header>

        <div className="message-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-bubble ${msg.sender === username ? 'message-own' : 'message-other'}`}>
              <div className="message-info" style={{ justifyContent: msg.sender === username ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontWeight: 700, color: msg.sender === username ? 'white' : 'var(--primary)' }}>{msg.sender}</span>
                <span style={{ opacity: 0.7, marginLeft: '0.5rem' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: '1rem', lineHeight: 1.5 }}>{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <form className="input-container" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              className="chat-input" 
              placeholder={`Message #${activeChannelInfo?.name || activeRoom}`} 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="btn-send">
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
      <style>{`
        .user-badge { padding: 0.75rem 1rem; border-radius: 0.75rem; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s ease; }
        .user-badge:hover { background: rgba(255, 255, 255, 0.05); }
        .active-room { background: rgba(99, 102, 241, 0.1) !important; color: var(--primary) !important; }
      `}</style>
    </div>
  );
}

export default App;
