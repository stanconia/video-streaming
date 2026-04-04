import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NewConversationButtonProps {
  teacherUserId: string;
  teacherDisplayName: string;
}

export const NewConversationButton: React.FC<NewConversationButtonProps> = ({
  teacherUserId,
  teacherDisplayName,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/messages?to=${encodeURIComponent(teacherUserId)}&name=${encodeURIComponent(teacherDisplayName)}`);
  };

  return (
    <button onClick={handleClick} style={styles.button}>
      Message Guide
    </button>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};
