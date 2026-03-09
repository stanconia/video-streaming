import React from 'react';

interface Props {
  onSelectEmoji: (emoji: string) => void;
}

const EMOJIS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F44F}', '\u{1F389}', '\u{1F914}'];

export const ReactionPicker: React.FC<Props> = ({ onSelectEmoji }) => (
  <div style={styles.container}>
    {EMOJIS.map(emoji => (
      <button key={emoji} style={styles.button} onClick={() => onSelectEmoji(emoji)}>{emoji}</button>
    ))}
  </div>
);

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', gap: '4px' },
  button: {
    width: '36px', height: '36px', border: 'none', borderRadius: '50%',
    backgroundColor: '#f0f0f0', cursor: 'pointer', fontSize: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
