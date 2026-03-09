import React from 'react';

interface Props {
  isHandRaised: boolean;
  onToggle: () => void;
}

export const HandRaiseButton: React.FC<Props> = ({ isHandRaised, onToggle }) => (
  <button
    style={{
      ...styles.button,
      backgroundColor: isHandRaised ? '#e6a817' : '#f0c040',
      opacity: isHandRaised ? 0.9 : 1,
    }}
    onClick={onToggle}
  >
    {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
  </button>
);

const styles: { [key: string]: React.CSSProperties } = {
  button: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
  },
};
