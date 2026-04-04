import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { LocationSelector } from '../shared/LocationSelector';
import { MultiSubjectSelector } from '../shared/MultiSubjectSelector';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('STUDENT');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  const dateOfBirth = dobYear && dobMonth && dobDay
    ? `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}` : '';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  const daysInMonth = dobMonth && dobYear
    ? new Date(parseInt(dobYear), parseInt(dobMonth), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [subjectInterestsArr, setSubjectInterestsArr] = useState<string[]>([]);
  const [headline, setHeadline] = useState('');
  const [subjectsArr, setSubjectsArr] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentPending, setConsentPending] = useState(false);

  const isUnder13 = dateOfBirth ? (() => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 13;
  })() : false;

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
      if (!dateOfBirth) {
        setError('Date of birth is required');
        setIsSubmitting(false);
        return;
      }
      if (isUnder13 && !parentEmail) {
        setError('Parent/guardian email is required for users under 13');
        setIsSubmitting(false);
        return;
      }
      const location = city && country ? `${city}, ${country}` : country || undefined;
      const subjectInterests = subjectInterestsArr.length > 0 ? subjectInterestsArr.join(', ') : undefined;
      const subjects = subjectsArr.length > 0 ? subjectsArr.join(', ') : undefined;
      await register({
        email, password, displayName, role,
        dateOfBirth,
        parentEmail: isUnder13 ? parentEmail : undefined,
        location,
        bio: bio || undefined,
        subjectInterests,
        headline: role === 'TEACHER' && headline ? headline : undefined,
        subjects: role === 'TEACHER' && subjects ? subjects : undefined,
        experienceYears: role === 'TEACHER' && experienceYears ? Number(experienceYears) : undefined,
      });
      if (isUnder13) {
        setConsentPending(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (consentPending) {
    return (
      <div style={styles.container} className="page-container">
        <div style={styles.card} className="auth-card">
          <h1 style={styles.title}>KyroAcademy</h1>
          <h2 style={styles.subtitle}>Parental Consent Required</h2>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ marginBottom: '16px', color: '#333' }}>
              Your account has been created, but since you are under 13, we need your parent or guardian's permission before you can use the platform.
            </p>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              We've sent an email to <strong>{parentEmail}</strong> with a link to approve your account.
            </p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Once your parent/guardian approves, you can log in and start learning.
            </p>
            <Link to="/login" style={{ ...styles.button, display: 'inline-block', textDecoration: 'none', marginTop: '20px' }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="page-container">
      <div style={styles.card} className="auth-card">
        <h1 style={styles.title}>KyroAcademy</h1>
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
                Kyro Guide
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="STUDENT"
                  checked={role === 'STUDENT'}
                  onChange={() => setRole('STUDENT')}
                />
                Kyro Learner
              </label>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Date of Birth</label>
            <div style={{ display: 'flex', gap: '8px' }} data-testid="dob-input">
              <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)}
                      required style={{ ...styles.input, flex: 2 }}>
                <option value="">Month</option>
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={dobDay} onChange={(e) => setDobDay(e.target.value)}
                      required style={{ ...styles.input, flex: 1 }}>
                <option value="">Day</option>
                {days.map((d) => <option key={d} value={String(d)}>{d}</option>)}
              </select>
              <select value={dobYear} onChange={(e) => setDobYear(e.target.value)}
                      required style={{ ...styles.input, flex: 1.2 }}>
                <option value="">Year</option>
                {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>

          {isUnder13 && (
            <div style={styles.field}>
              <label style={styles.label}>Parent/Guardian Email</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="parent@example.com"
              />
              <span style={{ fontSize: '12px', color: '#e67e22', marginTop: '4px', display: 'block' }}>
                Required for users under 13 (COPPA compliance). Your parent/guardian will receive an email to approve your account.
              </span>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Location <span style={styles.optional}>(optional)</span></label>
            <LocationSelector
              country={country}
              city={city}
              onCountryChange={setCountry}
              onCityChange={setCity}
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
              <MultiSubjectSelector
                selected={subjectInterestsArr}
                onChange={setSubjectInterestsArr}
              />
            </div>
          )}

          {role === 'TEACHER' && (
            <>
              <div style={styles.divider}>Kyro Guide Details</div>
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
                <MultiSubjectSelector
                  selected={subjectsArr}
                  onChange={setSubjectsArr}
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
