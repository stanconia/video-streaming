import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Quiz, QuizQuestion, CreateQuizRequest, QuizQuestionRequest } from '../../types/course/quiz.types';
import { quizApi } from '../../services/api/course/QuizApi';

interface QuizBuilderProps {
  courseId: string;
  moduleId: string;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ courseId, moduleId }) => {
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<string, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New quiz form state
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [passPercentage, setPassPercentage] = useState('70');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');

  // New question form state (per quiz)
  const [activeQuestionForm, setActiveQuestionForm] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [points, setPoints] = useState('1');

  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quizApi.getQuizzes(courseId, moduleId);
      setQuizzes(data);
      // Load questions for each quiz
      const qMap: Record<string, QuizQuestion[]> = {};
      await Promise.all(
        data.map(async (quiz) => {
          try {
            const questions = await quizApi.getQuestions(courseId, quiz.id);
            qMap[quiz.id] = questions;
          } catch {
            qMap[quiz.id] = [];
          }
        })
      );
      setQuestionsMap(qMap);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setError('Quiz title is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const request: CreateQuizRequest = {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        passPercentage: parseInt(passPercentage) || 70,
        timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : undefined,
        orderIndex: quizzes.length,
      };
      await quizApi.createQuiz(courseId, moduleId, request);
      setQuizTitle('');
      setQuizDescription('');
      setPassPercentage('70');
      setTimeLimitMinutes('');
      setShowQuizForm(false);
      loadQuizzes();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== idx);
    setOptions(newOptions);
    if (correctOptionIndex >= newOptions.length) {
      setCorrectOptionIndex(newOptions.length - 1);
    }
  };

  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = async (quizId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }
    const filledOptions = options.filter((o) => o.trim() !== '');
    if (filledOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const request: QuizQuestionRequest = {
        questionText: questionText.trim(),
        options: filledOptions,
        correctOptionIndex,
        points: parseInt(points) || 1,
      };
      await quizApi.addQuestion(courseId, quizId, request);
      setQuestionText('');
      setOptions(['', '']);
      setCorrectOptionIndex(0);
      setPoints('1');
      setActiveQuestionForm(null);
      // Reload questions for this quiz
      const updatedQuestions = await quizApi.getQuestions(courseId, quizId);
      setQuestionsMap((prev) => ({ ...prev, [quizId]: updatedQuestions }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (quizId: string, questionId: string) => {
    try {
      setError(null);
      await quizApi.deleteQuestion(courseId, quizId, questionId);
      setQuestionsMap((prev) => ({
        ...prev,
        [quizId]: (prev[quizId] || []).filter((q) => q.id !== questionId),
      }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      setError(null);
      await quizApi.deleteQuiz(courseId, quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      setQuestionsMap((prev) => {
        const copy = { ...prev };
        delete copy[quizId];
        return copy;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete quiz');
    }
  };

  if (loading) return <div style={styles.loading}>Loading quizzes...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Quizzes</h2>
        <button
          onClick={() => setShowQuizForm(!showQuizForm)}
          style={styles.addButton}
        >
          {showQuizForm ? 'Cancel' : '+ Add Quiz'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create quiz form */}
      {showQuizForm && (
        <form onSubmit={handleCreateQuiz} style={styles.formCard}>
          <h3 style={styles.formTitle}>New Quiz</h3>
          <div style={styles.field}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              required
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Quiz title"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              style={styles.textarea}
            />
          </div>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Pass Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={passPercentage}
                onChange={(e) => setPassPercentage(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Time Limit (minutes)</label>
              <input
                type="number"
                min="1"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                placeholder="No limit"
                style={styles.input}
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} style={styles.saveButton}>
            {submitting ? 'Creating...' : 'Create Quiz'}
          </button>
        </form>
      )}

      {/* Quiz list */}
      {quizzes.length === 0 && !showQuizForm ? (
        <div style={styles.empty}>No quizzes for this module yet.</div>
      ) : (
        <div style={styles.quizList}>
          {quizzes.map((quiz) => {
            const questions = questionsMap[quiz.id] || [];
            return (
              <div key={quiz.id} style={styles.quizCard}>
                <div style={styles.quizHeader}>
                  <div>
                    <h3 style={styles.quizTitle}>{quiz.title}</h3>
                    <div style={styles.quizMeta}>
                      <span>Pass: {quiz.passPercentage}%</span>
                      {quiz.timeLimitMinutes && <span>Time: {quiz.timeLimitMinutes} min</span>}
                      <span>Questions: {questions.length}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteQuiz(quiz.id)} style={styles.deleteButton}>
                    Delete
                  </button>
                </div>

                {quiz.description && (
                  <p style={styles.quizDescription}>{quiz.description}</p>
                )}

                {/* Question list */}
                {questions.length > 0 && (
                  <div style={styles.questionList}>
                    {questions.map((q, idx) => (
                      <div key={q.id} style={styles.questionItem}>
                        <div style={styles.questionItemHeader}>
                          <span style={styles.questionLabel}>
                            Q{idx + 1}: {q.questionText}
                          </span>
                          <span style={styles.questionMeta}>
                            {q.points} pts | Correct: Option {q.correctOptionIndex + 1}
                          </span>
                        </div>
                        <div style={styles.optionsPreview}>
                          {q.options.map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              style={optIdx === q.correctOptionIndex ? styles.correctOption : styles.optionPreview}
                            >
                              {optIdx + 1}. {opt}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(quiz.id, q.id)}
                          style={styles.deleteSmall}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add question form */}
                {activeQuestionForm === quiz.id ? (
                  <form onSubmit={(e) => handleAddQuestion(quiz.id, e)} style={styles.questionForm}>
                    <h4 style={styles.formSubtitle}>Add Question</h4>
                    <div style={styles.field}>
                      <label style={styles.label}>Question Text *</label>
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter your question"
                        rows={2}
                        required
                        style={styles.textarea}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Options (2-4)</label>
                      {options.map((opt, idx) => (
                        <div key={idx} style={styles.optionRow}>
                          <input
                            type="radio"
                            name="correctOption"
                            checked={correctOptionIndex === idx}
                            onChange={() => setCorrectOptionIndex(idx)}
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            style={styles.optionInput}
                          />
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              style={styles.removeOptionButton}
                            >
                              X
                            </button>
                          )}
                        </div>
                      ))}
                      {options.length < 4 && (
                        <button type="button" onClick={handleAddOption} style={styles.addOptionButton}>
                          + Add Option
                        </button>
                      )}
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Points</label>
                      <input
                        type="number"
                        min="1"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        style={styles.inputSmall}
                      />
                    </div>
                    <div style={styles.formActions}>
                      <button type="submit" disabled={submitting} style={styles.saveButton}>
                        {submitting ? 'Adding...' : 'Add Question'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuestionForm(null);
                          setQuestionText('');
                          setOptions(['', '']);
                          setCorrectOptionIndex(0);
                          setPoints('1');
                        }}
                        style={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setActiveQuestionForm(quiz.id);
                      setQuestionText('');
                      setOptions(['', '']);
                      setCorrectOptionIndex(0);
                      setPoints('1');
                    }}
                    style={styles.addQuestionButton}
                  >
                    + Add Question
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { margin: 0, fontSize: '18px' },
  loading: { textAlign: 'center', padding: '20px', color: '#666' },
  error: { color: '#721c24', padding: '12px', marginBottom: '16px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  empty: { textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' },
  addButton: { padding: '8px 16px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  formCard: { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', marginBottom: '20px', border: '1px solid #dee2e6' },
  formTitle: { margin: '0 0 16px 0', fontSize: '16px' },
  formSubtitle: { margin: '0 0 12px 0', fontSize: '15px', color: '#333' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#333', fontSize: '14px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  inputSmall: { width: '100px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  row: { display: 'flex', gap: '16px' },
  saveButton: { padding: '10px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  cancelButton: { padding: '10px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  formActions: { display: 'flex', gap: '10px' },
  quizList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  quizCard: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #dee2e6' },
  quizHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  quizTitle: { margin: '0 0 6px 0', fontSize: '16px' },
  quizMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#666' },
  quizDescription: { margin: '8px 0 0', fontSize: '14px', color: '#555' },
  deleteButton: { padding: '6px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  deleteSmall: { padding: '4px 10px', backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginTop: '6px' },
  questionList: { marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  questionItem: { padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #eee' },
  questionItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  questionLabel: { fontWeight: 'bold', fontSize: '14px', color: '#333', flex: 1 },
  questionMeta: { fontSize: '12px', color: '#888', whiteSpace: 'nowrap' as const, marginLeft: '12px' },
  optionsPreview: { display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '8px' },
  optionPreview: { fontSize: '13px', color: '#555' },
  correctOption: { fontSize: '13px', color: '#155724', fontWeight: 'bold' },
  questionForm: { marginTop: '16px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' },
  optionRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  optionInput: { flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' as const },
  removeOptionButton: { padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  addOptionButton: { padding: '6px 12px', backgroundColor: 'transparent', color: '#0d9488', border: '1px solid #0d9488', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  addQuestionButton: { marginTop: '12px', padding: '8px 16px', backgroundColor: 'transparent', color: '#0d9488', border: '1px dashed #0d9488', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', width: '100%' },
};
