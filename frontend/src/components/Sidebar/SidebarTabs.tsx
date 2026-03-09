import React from 'react';

interface Tab {
  id: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const SidebarTabs: React.FC<Props> = ({ tabs, activeTab, onTabChange }) => {
  const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div style={styles.container}>
      <div style={styles.tabBar}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tabButton,
                backgroundColor: isActive ? '#16213e' : 'transparent',
                color: isActive ? '#e0e0e0' : '#888',
                borderBottom: isActive ? '2px solid #3a7bd5' : '2px solid transparent',
              }}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={styles.badge}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      <div style={styles.content}>
        {activeContent}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    minHeight: '400px',
  },
  tabBar: {
    display: 'flex',
    backgroundColor: '#0d1117',
    borderBottom: '1px solid #333',
    overflowX: 'auto',
  },
  tabButton: {
    flex: 1,
    padding: '10px 12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
    position: 'relative',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: '0 5px',
    backgroundColor: '#ff4444',
    color: '#fff',
    borderRadius: '9px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
  },
};
