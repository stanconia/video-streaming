import React from 'react';

interface PollData {
  pollId: string;
  question: string;
  options: string[];
  votes: Record<number, number>;
  totalVotes: number;
  isActive: boolean;
  hasVoted: boolean;
  myVote: number | null;
}

interface Props {
  poll: PollData;
  onVote: (index: number) => void;
  onEnd: () => void;
  role: string;
}

export const PollDisplay: React.FC<Props> = ({ poll, onVote, onEnd, role }) => {
  const canVote = poll.isActive && !poll.hasVoted;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.question}>{poll.question}</span>
        {poll.isActive && (
          <span style={styles.liveBadge}>LIVE</span>
        )}
      </div>
      <div style={styles.options}>
        {poll.options.map((option, index) => {
          const voteCount = poll.votes[index] || 0;
          const percentage = poll.totalVotes > 0
            ? Math.round((voteCount / poll.totalVotes) * 100)
            : 0;
          const isMyVote = poll.myVote === index;

          return (
            <button
              key={index}
              style={{
                ...styles.optionButton,
                borderColor: isMyVote ? '#4caf50' : '#333',
                cursor: canVote ? 'pointer' : 'default',
              }}
              onClick={() => canVote && onVote(index)}
              disabled={!canVote}
            >
              <div style={styles.optionContent}>
                <span style={{
                  ...styles.optionText,
                  fontWeight: isMyVote ? 'bold' : 'normal',
                }}>
                  {option}
                  {isMyVote && ' (your vote)'}
                </span>
                <span style={styles.voteCount}>{voteCount} votes</span>
              </div>
              <div style={styles.barBackground}>
                <div style={{
                  ...styles.barFill,
                  width: `${percentage}%`,
                  backgroundColor: isMyVote ? '#4caf50' : '#3a7bd5',
                }} />
              </div>
              <span style={styles.percentage}>{percentage}%</span>
            </button>
          );
        })}
      </div>
      <div style={styles.footer}>
        <span style={styles.totalVotes}>{poll.totalVotes} total votes</span>
        {role === 'broadcaster' && poll.isActive && (
          <button style={styles.endButton} onClick={onEnd}>
            End Poll
          </button>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  question: {
    color: '#e0e0e0',
    fontSize: '15px',
    fontWeight: 'bold',
    flex: 1,
  },
  liveBadge: {
    backgroundColor: '#ff4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '10px',
    letterSpacing: '1px',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  optionButton: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '10px',
    backgroundColor: '#16213e',
    border: '1px solid #333',
    borderRadius: '6px',
    textAlign: 'left',
  },
  optionContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: '#e0e0e0',
    fontSize: '13px',
  },
  voteCount: {
    color: '#888',
    fontSize: '12px',
  },
  barBackground: {
    width: '100%',
    height: '6px',
    backgroundColor: '#0d1117',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  percentage: {
    color: '#aaa',
    fontSize: '12px',
    textAlign: 'right',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '6px',
    borderTop: '1px solid #333',
  },
  totalVotes: {
    color: '#888',
    fontSize: '12px',
  },
  endButton: {
    padding: '6px 14px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
};
