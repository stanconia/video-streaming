import React, { useState } from 'react';

interface Props {
  onCreatePoll: (question: string, options: string[]) => void;
}

export const CreatePollForm: React.FC<Props> = ({ onCreatePoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (trimmedQuestion && trimmedOptions.length >= 2) {
      onCreatePoll(trimmedQuestion, trimmedOptions);
      setQuestion('');
      setOptions(['', '']);
    }
  };

  const isValid = question.trim().length > 0 && options.filter(o => o.trim().length > 0).length >= 2;

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question..."
        style={styles.input}
      />
      <div style={styles.optionsContainer}>
        {options.map((option, index) => (
          <input
            key={index}
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            style={styles.input}
          />
        ))}
      </div>
      {options.length < 4 && (
        <button type="button" style={styles.addButton} onClick={handleAddOption}>
          + Add Option
        </button>
      )}
      <button type="submit" style={{
        ...styles.submitButton,
        opacity: isValid ? 1 : 0.5,
        cursor: isValid ? 'pointer' : 'not-allowed',
      }} disabled={!isValid}>
        Start Poll
      </button>
    </form>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
  },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  addButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    color: '#4caf50',
    border: '1px dashed #4caf50',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  submitButton: {
    padding: '10px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};
