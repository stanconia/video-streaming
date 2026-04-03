import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from '../Notification/NotificationBell';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const navLinkStyle = (path: string): React.CSSProperties => ({
    ...styles.navLink,
    ...(isActive(path) ? styles.activeLink : {}),
  });

  const handleNav = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <nav style={styles.nav} className="navbar">
      <div style={styles.left} className="navbar-left">
        <span style={styles.brand} onClick={() => handleNav('/')}>MindMint</span>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
      <div className={'navbar-links' + (menuOpen ? ' open' : '')}>
        {user.role === 'ADMIN' && (
          <button onClick={() => handleNav('/admin')} style={navLinkStyle('/admin')}>Admin</button>
        )}
        <button onClick={() => handleNav('/courses')} style={navLinkStyle('/courses')}>Courses</button>
        <button onClick={() => handleNav('/teachers')} style={navLinkStyle('/teachers')}>Mind Pros</button>
        <button onClick={() => handleNav('/messages')} style={navLinkStyle('/messages')}>Messages</button>
        <button onClick={() => handleNav('/calendar')} style={navLinkStyle('/calendar')}>Calendar</button>
        <button onClick={() => handleNav('/recordings')} style={navLinkStyle('/recordings')}>Recordings</button>
      </div>
      <div style={styles.right} className="navbar-right">
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
        <NotificationBell />
        <span style={styles.userNameLink} className="user-name" onClick={() => handleNav('/profile/edit')}>{user.displayName}</span>
        <button onClick={logout} style={styles.logoutButton}>Logout</button>
      </div>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', height: '56px', boxShadow: 'var(--shadow)', transition: 'background-color 0.2s, border-color 0.2s' },
  left: { display: 'flex', alignItems: 'center', gap: '4px' },
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  brand: { fontWeight: 'bold', fontSize: '18px', color: 'var(--accent)', cursor: 'pointer', marginRight: '16px' },
  navLink: { background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)', borderRadius: '4px' },
  activeLink: { backgroundColor: 'var(--bg-secondary)', color: 'var(--accent)', fontWeight: 'bold' },
  userNameLink: { fontSize: '14px', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'none' },
  logoutButton: { padding: '6px 14px', backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
};
