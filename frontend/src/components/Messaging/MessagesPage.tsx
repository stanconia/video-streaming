import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../context/AuthContext';
import { conversationApi } from '../../services/api/social/ConversationApi';
import { courseApi } from '../../services/api/course/CourseApi';
import { enrollmentApi } from '../../services/api/course/EnrollmentApi';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { CourseEnrollment } from '../../types/course/enrollment.types';
import { Course } from '../../types/course/course.types';

interface PickerContact {
  userId: string;
  displayName: string;
  courseTitle: string;
}

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { conversations, loading, loadConversations } = useMessages();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDisplayName, setSelectedDisplayName] = useState<string>('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contacts, setContacts] = useState<PickerContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle deep link: /messages?to=userId&name=displayName
  useEffect(() => {
    const toUserId = searchParams.get('to');
    const toName = searchParams.get('name');
    if (toUserId && toName) {
      handleStartConversation(toUserId, toName);
    }
  }, [searchParams]);

  const handleStartConversation = async (recipientUserId: string, displayName: string) => {
    try {
      // Check if conversation already exists
      const existing = conversations.find((c) => c.otherUserId === recipientUserId);
      if (existing) {
        setSelectedConversationId(existing.id);
        setSelectedUserId(existing.otherUserId);
        setSelectedDisplayName(existing.otherDisplayName);
        setShowContactPicker(false);
        return;
      }
      // Send an initial message to create the conversation, then reload
      await conversationApi.sendMessage({
        recipientUserId,
        content: 'Hello!',
      });
      await loadConversations();
      // Find the conversation with this user
      const updated = await conversationApi.getConversations();
      const conv = updated.find((c) => c.otherUserId === recipientUserId);
      if (conv) {
        setSelectedConversationId(conv.id);
        setSelectedUserId(conv.otherUserId);
        setSelectedDisplayName(conv.otherDisplayName);
      }
      setShowContactPicker(false);
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  };

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const contactMap = new Map<string, PickerContact>();

      if (isTeacher) {
        // Teacher: show enrolled students across their courses
        const courses: Course[] = await courseApi.getTeacherCourses();
        for (const course of courses) {
          try {
            const enrollments: CourseEnrollment[] = await enrollmentApi.getCourseEnrollments(course.id);
            for (const e of enrollments) {
              if (!contactMap.has(e.studentUserId)) {
                contactMap.set(e.studentUserId, {
                  userId: e.studentUserId,
                  displayName: e.studentDisplayName,
                  courseTitle: course.title,
                });
              }
            }
          } catch {}
        }
      } else {
        // Student: show teachers of courses they are enrolled in
        const enrollments: CourseEnrollment[] = await enrollmentApi.getMyEnrollments();
        for (const enrollment of enrollments) {
          if (enrollment.status === 'CANCELLED') continue;
          try {
            const course: Course = await courseApi.getCourse(enrollment.courseId);
            if (!contactMap.has(course.teacherUserId)) {
              contactMap.set(course.teacherUserId, {
                userId: course.teacherUserId,
                displayName: course.teacherDisplayName,
                courseTitle: course.title,
              });
            }
          } catch {}
        }
      }
      setContacts(Array.from(contactMap.values()));
    } catch (err) {
      console.error('Failed to load contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleNewMessage = () => {
    setShowContactPicker(true);
    loadContacts();
  };

  const handleSelectConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    setSelectedConversationId(id);
    setSelectedUserId(conv?.otherUserId || '');
    setSelectedDisplayName(conv?.otherDisplayName || '');
    setShowContactPicker(false);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    setSelectedUserId('');
    setSelectedDisplayName('');
    setShowContactPicker(false);
    loadConversations();
  };

  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <h1 style={styles.title}>Messages</h1>
        {(isTeacher || isStudent) && !showContactPicker && (
          <button onClick={handleNewMessage} style={styles.newMsgBtn}>
            + New Message
          </button>
        )}
      </div>

      {showContactPicker && (
        <div style={styles.pickerOverlay}>
          <div style={styles.pickerCard}>
            <div style={styles.pickerHeader}>
              <h3 style={{ margin: 0 }}>{isTeacher ? 'Message a Kyro' : 'Message a Guide'}</h3>
              <button onClick={() => setShowContactPicker(false)} style={styles.pickerClose}>✕</button>
            </div>
            <p style={styles.pickerSubtext}>
              {isTeacher
                ? 'Kyros enrolled in your courses:'
                : 'Guides from your enrolled courses:'}
            </p>
            {loadingContacts ? (
              <div style={styles.pickerLoading}>Loading...</div>
            ) : contacts.length === 0 ? (
              <div style={styles.pickerEmpty}>
                {isTeacher
                  ? 'No enrolled Kyros found.'
                  : 'No Guides found. Enroll in a course to message its Guide.'}
              </div>
            ) : (
              <div style={styles.pickerList}>
                {contacts.map((c) => (
                  <div
                    key={c.userId}
                    style={styles.pickerItem}
                    onClick={() => handleStartConversation(c.userId, c.displayName)}
                  >
                    <div style={{
                      ...styles.pickerAvatar,
                      backgroundColor: isTeacher ? '#28a745' : '#007bff',
                    }}>
                      {c.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.pickerName}>{c.displayName}</div>
                      <div style={styles.pickerCourse}>{c.courseTitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && conversations.length === 0 ? (
        <div style={styles.loading}>Loading conversations...</div>
      ) : (
        <div style={styles.layout} className="messages-layout">
          <div
            style={styles.sidebar}
            className={'messages-sidebar' + (selectedConversationId ? ' hidden' : '')}
          >
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={handleSelectConversation}
            />
          </div>

          <div
            style={styles.main}
            className={'messages-main' + (!selectedConversationId ? ' hidden' : '')}
          >
            {selectedConversationId ? (
              <ConversationView
                conversationId={selectedConversationId}
                otherUserId={selectedUserId}
                otherDisplayName={selectedDisplayName}
                onBack={handleBack}
              />
            ) : (
              <div style={styles.emptyMain}>
                {isTeacher
                  ? 'Select a conversation or click "+ New Message" to message a Kyro'
                  : 'Select a conversation or click "+ New Message" to message a Guide'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#212529',
  },
  newMsgBtn: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  layout: {
    display: 'flex',
    height: 'calc(100vh - 160px)',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  sidebar: {
    width: '300px',
    minWidth: '300px',
    borderRight: '1px solid #dee2e6',
    overflowY: 'auto',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  emptyMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: '16px',
    textAlign: 'center',
    padding: '20px',
  },
  pickerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  pickerCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  pickerClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 8px',
  },
  pickerSubtext: {
    color: '#666',
    fontSize: '13px',
    margin: '0 0 16px 0',
  },
  pickerLoading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  pickerEmpty: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  pickerList: {
    overflowY: 'auto',
    flex: 1,
  },
  pickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    cursor: 'pointer',
    borderRadius: '6px',
    borderBottom: '1px solid #f0f0f0',
  },
  pickerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#28a745',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0,
  },
  pickerName: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#212529',
  },
  pickerCourse: {
    fontSize: '12px',
    color: '#666',
  },
};
