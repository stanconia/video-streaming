import React from 'react';

interface PollResultData {
  question: string;
  options: string[];
  votes: Record<number, number>;
  totalVotes: number;
}

interface Props {
  poll: PollResultData;
}

export const PollResults: React.FC<Props> = ({ poll }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>Poll Results</span>
        <span style={styles.question}>{poll.question}</span>
      </div>
      <div style={styles.results}>
        {poll.options.map((option, index) => {
          const voteCount = poll.votes[index] || 0;
          const percentage = poll.totalVotes > 0
            ? Math.round((voteCount / poll.totalVotes) * 100)
            : 0;

          return (
            <div key={index} style={styles.resultRow}>
              <div style={styles.resultInfo}>
                <span style={styles.optionText}>{option}</span>
                <span style={styles.stats}>
                  {voteCount} vote{voteCount !== 1 ? 's' : ''} ({percentage}%)
                </span>
              </div>
              <div style={styles.barBackground}>
                <div style={{
                  ...styles.barFill,
                  width: `${percentage}%`,
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={styles.footer}>
        {poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  label: {
    color: '#4caf50',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  question: {
    color: '#e0e0e0',
    fontSize: '15px',
    fontWeight: 'bold',
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  resultRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: '#e0e0e0',
    fontSize: '14px',
  },
  stats: {
    color: '#aaa',
    fontSize: '13px',
  },
  barBackground: {
    width: '100%',
    height: '8px',
    backgroundColor: '#0d1117',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3a7bd5',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  footer: {
    color: '#888',
    fontSize: '12px',
    textAlign: 'center',
    paddingTop: '6px',
    borderTop: '1px solid #333',
  },
};
