import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('STUDENT');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [subjectInterests, setSubjectInterests] = useState('');
  const [headline, setHeadline] = useState('');
  const [subjects, setSubjects] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google sign-up failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register({
        email, password, displayName, role,
        location: location || undefined,
        bio: bio || undefined,
        subjectInterests: subjectInterests || undefined,
        headline: role === 'TEACHER' && headline ? headline : undefined,
        subjects: role === 'TEACHER' && subjects ? subjects : undefined,
        experienceYears: role === 'TEACHER' && experienceYears ? Number(experienceYears) : undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container} className="page-container">
      <div style={styles.card} className="auth-card">
        <h1 style={styles.title}>LearningHaven</h1>
        <h2 style={styles.subtitle}>Create Account</h2>

        {error && <div style={styles.error}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-up failed')}
            text="signup_with"
          />
        </div>

        <div style={{ textAlign: 'center', color: '#999', marginBottom: '16px', fontSize: '14px' }}>
          or register with email
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={styles.input}
              placeholder="Your name"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={styles.input}
              placeholder="At least 6 characters"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <div style={styles.roleGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="TEACHER"
                  checked={role === 'TEACHER'}
                  onChange={() => setRole('TEACHER')}
                />
                Teacher
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="STUDENT"
                  checked={role === 'STUDENT'}
                  onChange={() => setRole('STUDENT')}
                />
                Student
              </label>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Location <span style={styles.optional}>(optional)</span></label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={styles.input}
              placeholder="e.g. New York, NY"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Bio <span style={styles.optional}>(optional)</span></label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as any }}
              placeholder="Tell us about yourself"
            />
          </div>

          {role === 'STUDENT' && (
            <div style={styles.field}>
              <label style={styles.label}>Subject Interests <span style={styles.optional}>(optional)</span></label>
              <input
                type="text"
                value={subjectInterests}
                onChange={(e) => setSubjectInterests(e.target.value)}
                style={styles.input}
                placeholder="e.g. Math, Science, History"
              />
            </div>
          )}

          {role === 'TEACHER' && (
            <>
              <div style={styles.divider}>Teacher Details</div>
              <div style={styles.field}>
                <label style={styles.label}>Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Math tutor with 10 years experience"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Subjects</label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. Math, Physics, Chemistry"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Years of Experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : '')}
                  style={styles.input}
                  placeholder="0"
                  min="0"
                />
              </div>
            </>
          )}

          <button type="submit" disabled={isSubmitting} style={styles.button}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.linkText}>
          Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '4px',
    color: '#007bff',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: '24px',
    fontWeight: 'normal',
    color: '#666',
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#cc0000',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  roleGroup: {
    display: 'flex',
    gap: '20px',
    padding: '8px 0',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  button: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  linkText: {
    textAlign: 'center',
    marginTop: '16px',
    color: '#666',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
  },
  optional: {
    fontWeight: 'normal',
    color: '#999',
    fontSize: '12px',
  },
  divider: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#007bff',
    borderTop: '1px solid #eee',
    paddingTop: '12px',
    marginTop: '4px',
  },
};
