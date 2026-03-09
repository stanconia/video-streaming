import React, { useEffect, useRef } from 'react';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  timestamp: number;
}

interface Props {
  reactions: Reaction[];
}

export const ReactionOverlay: React.FC<Props> = ({ reactions }) => {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes float-up {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-200px); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
    styleInjected.current = true;
    return () => {
      document.head.removeChild(styleEl);
      styleInjected.current = false;
    };
  }, []);

  return (
    <div style={styles.overlay}>
      {reactions.map(reaction => (
        <span
          key={reaction.id}
          style={{
            ...styles.reaction,
            left: `${reaction.x}%`,
            animation: 'float-up 3s ease-out forwards',
          }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 10,
  },
  reaction: {
    position: 'absolute',
    bottom: '20px',
    fontSize: '32px',
    pointerEvents: 'none',
  },
};
