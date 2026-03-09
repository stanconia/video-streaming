import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Quiz, QuizQuestion, QuizAttempt } from '../../types/course/quiz.types';
import { quizApi } from '../../services/api/course/QuizApi';

export const QuizTaker: React.FC = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!courseId || !quizId) return;
    try {
      setLoading(true);
      const [quizData, attemptData] = await Promise.all([
        quizApi.getQuestions(courseId, quizId),
        quizApi.getMyAttempts(courseId, quizId),
      ]);
      setQuestions(quizData);
      setAttempts(attemptData);
      if (quizData.length > 0) {
        const q: Quiz = {
          id: quizId,
          moduleId: quizData[0].quizId,
          courseId,
          title: '',
          description: '',
          passPercentage: 70,
          timeLimitMinutes: null,
          orderIndex: 0,
          questionCount: quizData.length,
          createdAt: '',
        };
        setQuiz(q);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [courseId, quizId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!courseId || !quizId) return;
    const loadQuizMeta = async () => {
      try {
        const data = await quizApi.getQuizzes(courseId, '');
        const found = data.find((q) => q.id === quizId);
        if (found) setQuiz(found);
      } catch {
        // quiz meta is best-effort; questions are already loaded
      }
    };
    loadQuizMeta();
  }, [courseId, quizId]);

  useEffect(() => {
    if (started && quiz?.timeLimitMinutes && timeRemaining === null) {
      setTimeRemaining(quiz.timeLimitMinutes * 60);
    }
  }, [started, quiz, timeRemaining]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && started && !result) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining, started, result]);

  useEffect(() => {
    if (timeRemaining === 0 && started && !result) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!courseId || !quizId) return;
    const answersArray = questions.map((q) => selectedAnswers[q.id] ?? -1);
    try {
      setSubmitting(true);
      setError(null);
      const attempt = await quizApi.submitAttempt(courseId, quizId, answersArray);
      setResult(attempt);
      if (timerRef.current) clearInterval(timerRef.current);
      const updatedAttempts = await quizApi.getMyAttempts(courseId, quizId);
      setAttempts(updatedAttempts);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartQuiz = () => {
    setStarted(true);
    setResult(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  if (!courseId || !quizId) return <div style={styles.error}>Missing course or quiz ID</div>;

  if (loading) return <div style={styles.loading}>Loading quiz...</div>;

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>{quiz?.title || 'Quiz'}</h1>
      {quiz?.description && <p style={styles.description}>{quiz.description}</p>}

      {error && <div style={styles.error}>{error}</div>}

      {/* Result display */}
      {result && (
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>Quiz Results</h2>
          <div style={styles.resultRow}>
            <span style={styles.resultLabel}>Score:</span>
            <span style={styles.resultValue}>{result.score} / {result.totalPoints}</span>
          </div>
          <div style={styles.resultRow}>
            <span style={styles.resultLabel}>Percentage:</span>
            <span style={styles.resultValue}>{result.percentage.toFixed(1)}%</span>
          </div>
          <div style={styles.resultRow}>
            <span style={styles.resultLabel}>Status:</span>
            <span style={result.passed ? styles.passedBadge : styles.failedBadge}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
          <button onClick={handleStartQuiz} style={styles.retryButton}>
            Retake Quiz
          </button>
        </div>
      )}

      {/* Quiz not started or finished */}
      {!started && !result && (
        <div style={styles.startCard}>
          <div style={styles.quizMeta}>
            <span>Questions: {totalQuestions}</span>
            {quiz?.timeLimitMinutes && <span>Time Limit: {quiz.timeLimitMinutes} min</span>}
            {quiz?.passPercentage && <span>Pass: {quiz.passPercentage}%</span>}
          </div>
          <button onClick={handleStartQuiz} style={styles.startButton}>
            Start Quiz
          </button>
        </div>
      )}

      {/* Active quiz */}
      {started && !result && (
        <div>
          {/* Timer */}
          {timeRemaining !== null && (
            <div style={{
              ...styles.timerBar,
              color: timeRemaining < 60 ? '#dc3545' : '#333',
            }}>
              Time Remaining: {formatTime(timeRemaining)}
            </div>
          )}

          {/* Toggle view mode */}
          <div style={styles.viewToggle}>
            <button
              onClick={() => setShowAllQuestions(false)}
              style={!showAllQuestions ? styles.toggleActive : styles.toggleInactive}
            >
              One at a Time
            </button>
            <button
              onClick={() => setShowAllQuestions(true)}
              style={showAllQuestions ? styles.toggleActive : styles.toggleInactive}
            >
              Show All
            </button>
          </div>

          {showAllQuestions ? (
            /* All questions view */
            <div style={styles.questionsList}>
              {questions.map((q, idx) => (
                <div key={q.id} style={styles.questionCard}>
                  <div style={styles.questionHeader}>
                    <span style={styles.questionNumber}>Q{idx + 1}.</span>
                    <span style={styles.questionPoints}>({q.points} pts)</span>
                  </div>
                  <p style={styles.questionText}>{q.questionText}</p>
                  <div style={styles.optionsList}>
                    {q.options.map((opt, optIdx) => (
                      <label key={optIdx} style={styles.optionLabel}>
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={selectedAnswers[q.id] === optIdx}
                          onChange={() => handleSelectAnswer(q.id, optIdx)}
                          style={styles.radio}
                        />
                        <span style={styles.optionText}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Single question view */
            currentQuestion && (
              <div style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <span style={styles.questionNumber}>
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span style={styles.questionPoints}>({currentQuestion.points} pts)</span>
                </div>
                <p style={styles.questionText}>{currentQuestion.questionText}</p>
                <div style={styles.optionsList}>
                  {currentQuestion.options.map((opt, optIdx) => (
                    <label key={optIdx} style={styles.optionLabel}>
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={selectedAnswers[currentQuestion.id] === optIdx}
                        onChange={() => handleSelectAnswer(currentQuestion.id, optIdx)}
                        style={styles.radio}
                      />
                      <span style={styles.optionText}>{opt}</span>
                    </label>
                  ))}
                </div>
                <div style={styles.navButtons}>
                  <button
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    style={currentIndex === 0 ? styles.navButtonDisabled : styles.navButton}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                    disabled={currentIndex === totalQuestions - 1}
                    style={currentIndex === totalQuestions - 1 ? styles.navButtonDisabled : styles.navButton}
                  >
                    Next
                  </button>
                </div>
              </div>
            )
          )}

          {/* Progress and submit */}
          <div style={styles.submitArea}>
            <span style={styles.progressText}>
              {answeredCount} of {totalQuestions} answered
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
              style={submitting || answeredCount === 0 ? styles.submitButtonDisabled : styles.submitButton}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      )}

      {/* Past attempts */}
      {attempts.length > 0 && (
        <div style={styles.attemptsSection}>
          <h2 style={styles.sectionTitle}>Past Attempts</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Percentage</th>
                <th style={styles.th}>Result</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td style={styles.td}>{formatDate(attempt.startedAt)}</td>
                  <td style={styles.td}>{attempt.score} / {attempt.totalPoints}</td>
                  <td style={styles.td}>{attempt.percentage.toFixed(1)}%</td>
                  <td style={styles.td}>
                    <span style={attempt.passed ? styles.passedBadge : styles.failedBadge}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  pageTitle: { marginBottom: '8px' },
  description: { color: '#666', marginBottom: '20px', fontSize: '15px' },
  loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  startCard: { backgroundColor: 'white', borderRadius: '8px', padding: '32px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', marginBottom: '24px' },
  quizMeta: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px', fontSize: '15px', color: '#555' },
  startButton: { padding: '14px 48px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' },
  timerBar: { textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' },
  viewToggle: { display: 'flex', gap: '8px', marginBottom: '16px' },
  toggleActive: { padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  toggleInactive: { padding: '8px 20px', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  questionsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  questionCard: { backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  questionNumber: { fontWeight: 'bold', fontSize: '16px', color: '#333' },
  questionPoints: { fontSize: '14px', color: '#888' },
  questionText: { fontSize: '16px', lineHeight: '1.5', marginBottom: '16px', color: '#333' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optionLabel: { display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: '6px', border: '1px solid #dee2e6', cursor: 'pointer', transition: 'background-color 0.15s' },
  radio: { marginRight: '12px', accentColor: '#007bff' },
  optionText: { fontSize: '15px', color: '#333' },
  navButtons: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' },
  navButton: { padding: '10px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  navButtonDisabled: { padding: '10px 24px', backgroundColor: '#dee2e6', color: '#adb5bd', border: 'none', borderRadius: '4px', cursor: 'default', fontSize: '14px' },
  submitArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' },
  progressText: { fontSize: '14px', color: '#555' },
  submitButton: { padding: '12px 36px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  submitButtonDisabled: { padding: '12px 36px', backgroundColor: '#dee2e6', color: '#adb5bd', border: 'none', borderRadius: '6px', cursor: 'default', fontSize: '16px', fontWeight: 'bold' },
  resultCard: { backgroundColor: 'white', borderRadius: '8px', padding: '32px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' },
  resultTitle: { margin: '0 0 20px 0', fontSize: '22px' },
  resultRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '16px' },
  resultLabel: { fontWeight: 'bold', color: '#555' },
  resultValue: { fontWeight: 'bold', color: '#333' },
  passedBadge: { display: 'inline-block', padding: '4px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#d4edda', color: '#155724' },
  failedBadge: { display: 'inline-block', padding: '4px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f8d7da', color: '#721c24' },
  retryButton: { marginTop: '20px', padding: '10px 28px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' },
  attemptsSection: { marginTop: '32px', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  sectionTitle: { margin: '0 0 16px 0', fontSize: '18px' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: '2px solid #dee2e6', fontSize: '14px', color: '#555', fontWeight: 'bold' },
  td: { padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: '14px' },
};
