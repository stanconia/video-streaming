import React, { useState } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = 'Add a tag...' }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const tag = input.trim();
      if (!tags.includes(tag)) {
        onChange([...tags, tag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.container}>
      {tags.map((tag, i) => (
        <span key={i} style={styles.tag}>
          {tag}
          <span style={styles.remove} onClick={() => removeTag(i)}>x</span>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={styles.input}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white', minHeight: '40px', alignItems: 'center' },
  tag: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '13px', color: '#495057' },
  remove: { cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px', color: '#999' },
  input: { border: 'none', outline: 'none', flex: 1, minWidth: '80px', fontSize: '14px', padding: '4px 0' },
};
