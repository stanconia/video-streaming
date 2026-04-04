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
  const [showPassword, setShowPassword] = useState(false);

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
      if (isUnder13 && parentEmail.toLowerCase() === email.toLowerCase()) {
        setError('Parent/guardian email must be different from your email');
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

  // Password strength indicators
  const pwHas8 = password.length >= 8;
  const pwHasLower = /[a-z]/.test(password);
  const pwHasUpper = /[A-Z]/.test(password);
  const pwHasNumber = /[0-9]/.test(password);

  // Shared left panel for the two-column layout
  const leftPanel = (
    <div style={s.leftPanel} className="register-left-panel">
      <div style={s.leftGlow} />
      <div style={s.leftContent}>
        <div style={s.brandRow}>
          <span style={s.brandIcon}>K</span>
          <span style={s.brandText}>Kyro<span style={s.brandAccent}>Academy</span></span>
        </div>
        <h2 style={s.leftTagline}>Where curious minds find expert guidance</h2>
        <div style={s.featureBullets}>
          <div style={s.bullet}>
            <span style={s.checkIcon}>&#10003;</span>
            <span style={s.bulletText}>Live 1-on-1 sessions with expert tutors</span>
          </div>
          <div style={s.bullet}>
            <span style={s.checkIcon}>&#10003;</span>
            <span style={s.bulletText}>Personalized learning paths for every student</span>
          </div>
          <div style={s.bullet}>
            <span style={s.checkIcon}>&#10003;</span>
            <span style={s.bulletText}>Track progress with detailed analytics</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (consentPending) {
    return (
      <div style={s.splitContainer} className="page-container">
        <style>{responsiveCSS}</style>
        {leftPanel}
        <div style={s.rightPanel} className="register-right-panel">
          <div style={s.formWrapper}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '48px' }}>&#9993;</span>
            </div>
            <h2 style={s.formTitle}>Parental Consent Required</h2>
            <p style={s.consentBody}>
              Your account has been created, but since you are under 13, we need your parent or guardian's permission before you can use the platform.
            </p>
            <div style={s.consentInfoBox}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', lineHeight: '1.4' }}>&#128231;</span>
                <p style={{ margin: 0, fontSize: '14px', color: '#4a5568', lineHeight: '1.6' }}>
                  We've sent an email to <strong style={{ color: '#2d3748' }}>{parentEmail}</strong> with a link to approve your account.
                </p>
              </div>
            </div>
            <p style={{ color: '#718096', fontSize: '14px', textAlign: 'center', marginTop: '16px', marginBottom: '24px', lineHeight: '1.6' }}>
              Once your parent/guardian approves, you can log in and start learning.
            </p>
            <Link to="/login" style={{ ...s.submitBtn, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.splitContainer} className="page-container">
      <style>{responsiveCSS}</style>
      {leftPanel}
      <div style={s.rightPanel} className="register-right-panel">
        <div style={s.formWrapper}>
          <h2 style={s.formTitle}>Create Account</h2>
          <p style={s.formSubtitle}>Join thousands of learners and guides on KyroAcademy</p>

          {error && <div style={s.error}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-up failed')}
              text="signup_with"
            />
          </div>

          <div style={s.dividerRow}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or register with email</span>
            <div style={s.dividerLine} />
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                style={s.input}
                placeholder="Your name"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={s.input}
                placeholder="you@example.com"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={s.passwordInput}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={s.showHideBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {password.length > 0 && (
                <div style={s.pwRequirements}>
                  <div style={s.pwReq}>
                    <span style={{ color: pwHas8 ? '#38a169' : '#cbd5e0', marginRight: '6px', fontSize: '13px' }}>
                      {pwHas8 ? '\u2713' : '\u25CB'}
                    </span>
                    <span style={{ color: pwHas8 ? '#38a169' : '#a0aec0' }}>8+ characters</span>
                  </div>
                  <div style={s.pwReq}>
                    <span style={{ color: pwHasLower ? '#38a169' : '#cbd5e0', marginRight: '6px', fontSize: '13px' }}>
                      {pwHasLower ? '\u2713' : '\u25CB'}
                    </span>
                    <span style={{ color: pwHasLower ? '#38a169' : '#a0aec0' }}>Lowercase letter</span>
                  </div>
                  <div style={s.pwReq}>
                    <span style={{ color: pwHasUpper ? '#38a169' : '#cbd5e0', marginRight: '6px', fontSize: '13px' }}>
                      {pwHasUpper ? '\u2713' : '\u25CB'}
                    </span>
                    <span style={{ color: pwHasUpper ? '#38a169' : '#a0aec0' }}>Uppercase letter</span>
                  </div>
                  <div style={s.pwReq}>
                    <span style={{ color: pwHasNumber ? '#38a169' : '#cbd5e0', marginRight: '6px', fontSize: '13px' }}>
                      {pwHasNumber ? '\u2713' : '\u25CB'}
                    </span>
                    <span style={{ color: pwHasNumber ? '#38a169' : '#a0aec0' }}>Number</span>
                  </div>
                </div>
              )}
            </div>

            <div style={s.field}>
              <label style={s.label}>Role</label>
              <div style={s.roleGroup}>
                <label
                  style={role === 'TEACHER' ? { ...s.rolePill, ...s.rolePillActive } : s.rolePill}
                >
                  <input
                    type="radio"
                    name="role"
                    value="TEACHER"
                    checked={role === 'TEACHER'}
                    onChange={() => setRole('TEACHER')}
                    style={s.hiddenRadio}
                  />
                  Kyro Guide
                </label>
                <label
                  style={role === 'STUDENT' ? { ...s.rolePill, ...s.rolePillActive } : s.rolePill}
                >
                  <input
                    type="radio"
                    name="role"
                    value="STUDENT"
                    checked={role === 'STUDENT'}
                    onChange={() => setRole('STUDENT')}
                    style={s.hiddenRadio}
                  />
                  Kyro Learner
                </label>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Date of Birth</label>
              <div style={{ display: 'flex', gap: '8px' }} data-testid="dob-input">
                <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)}
                        required style={{ ...s.select, flex: 2 }}>
                  <option value="">Month</option>
                  {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={dobDay} onChange={(e) => setDobDay(e.target.value)}
                        required style={{ ...s.select, flex: 1 }}>
                  <option value="">Day</option>
                  {days.map((d) => <option key={d} value={String(d)}>{d}</option>)}
                </select>
                <select value={dobYear} onChange={(e) => setDobYear(e.target.value)}
                        required style={{ ...s.select, flex: 1.2 }}>
                  <option value="">Year</option>
                  {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
            </div>

            {isUnder13 && (
              <div style={s.field}>
                <label style={s.label}>Parent/Guardian Email</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  required
                  style={s.input}
                  placeholder="parent@example.com"
                />
                <div style={s.coppaBox}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '14px', lineHeight: '1.5', flexShrink: 0 }}>&#9432;</span>
                    <span style={{ fontSize: '12px', color: '#b7791f', lineHeight: '1.5' }}>
                      Required for users under 13 (COPPA compliance). Your parent/guardian will receive an email to approve your account.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={s.field}>
              <label style={s.label}>Location <span style={s.optional}>(optional)</span></label>
              <LocationSelector
                country={country}
                city={city}
                onCountryChange={setCountry}
                onCityChange={setCity}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Bio <span style={s.optional}>(optional)</span></label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ ...s.input, minHeight: '60px', resize: 'vertical' as any }}
                placeholder="Tell us about yourself"
              />
            </div>

            {role === 'STUDENT' && (
              <div style={s.field}>
                <label style={s.label}>Subject Interests <span style={s.optional}>(optional)</span></label>
                <MultiSubjectSelector
                  selected={subjectInterestsArr}
                  onChange={setSubjectInterestsArr}
                />
              </div>
            )}

            {role === 'TEACHER' && (
              <>
                <div style={s.teacherDivider}>Kyro Guide Details</div>
                <div style={s.field}>
                  <label style={s.label}>Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    style={s.input}
                    placeholder="e.g. Math tutor with 10 years experience"
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Subjects</label>
                  <MultiSubjectSelector
                    selected={subjectsArr}
                    onChange={setSubjectsArr}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Years of Experience</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : '')}
                    style={s.input}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </>
            )}

            <button type="submit" disabled={isSubmitting} style={s.submitBtn}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={s.linkText}>
            Already have an account? <Link to="/login" style={s.link}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Responsive CSS injected via <style> tag                           */
/* ------------------------------------------------------------------ */
const responsiveCSS = `
  .register-left-panel {
    display: flex;
  }
  @media (max-width: 767px) {
    .register-left-panel {
      display: none !important;
    }
    .register-right-panel {
      min-height: 100vh !important;
    }
  }
`;

/* ------------------------------------------------------------------ */
/*  Inline styles                                                     */
/* ------------------------------------------------------------------ */
const s: { [key: string]: React.CSSProperties } = {
  /* ----- Layout ----- */
  splitContainer: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  /* ----- Left panel (dark brand) ----- */
  leftPanel: {
    width: '44%',
    minHeight: '100vh',
    background: '#0a0a14',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 48px',
    boxSizing: 'border-box',
  },
  leftGlow: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(168,85,247,0.06) 40%, transparent 70%)',
    pointerEvents: 'none',
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '380px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  brandIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#fff',
    fontSize: '20px',
    fontWeight: 800,
  },
  brandText: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  brandAccent: {
    background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  leftTagline: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.3,
    letterSpacing: '-0.5px',
    marginBottom: '40px',
    marginTop: 0,
  },
  featureBullets: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  bullet: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(124,58,237,0.2)',
    color: '#a78bfa',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
  },

  /* ----- Right panel (form) ----- */
  rightPanel: {
    flex: 1,
    background: '#fff',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflowY: 'auto',
    padding: '48px 24px',
    boxSizing: 'border-box',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '440px',
    paddingTop: '12px',
    paddingBottom: '40px',
  },
  formTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--text-primary, #1a202c)',
    marginBottom: '6px',
    marginTop: 0,
    letterSpacing: '-0.5px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '28px',
    marginTop: 0,
    lineHeight: 1.5,
  },

  /* ----- Error ----- */
  error: {
    backgroundColor: '#fff5f5',
    color: '#c53030',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fed7d7',
    lineHeight: 1.5,
  },

  /* ----- Divider ----- */
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '4px 0 24px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e2e8f0',
  },
  dividerText: {
    fontSize: '13px',
    color: '#a0aec0',
    whiteSpace: 'nowrap',
  },

  /* ----- Form ----- */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--text-primary, #2d3748)',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary, #2d3748)',
    background: 'var(--bg-input, #fff)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
    width: '100%',
  },
  select: {
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary, #2d3748)',
    background: 'var(--bg-input, #fff)',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },

  /* ----- Password ----- */
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    padding: '12px 60px 12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary, #2d3748)',
    background: 'var(--bg-input, #fff)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  showHideBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#7c3aed',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    padding: '2px 4px',
    minHeight: 'auto',
    minWidth: 'auto',
  },
  pwRequirements: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 16px',
    marginTop: '4px',
  },
  pwReq: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
  },

  /* ----- Role pills ----- */
  roleGroup: {
    display: 'flex',
    gap: '10px',
  },
  rolePill: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: 500,
    color: '#4a5568',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: '#fff',
  },
  rolePillActive: {
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#fff',
    border: '1.5px solid transparent',
    fontWeight: 600,
  },
  hiddenRadio: {
    position: 'absolute',
    opacity: 0,
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  },

  /* ----- COPPA info box ----- */
  coppaBox: {
    marginTop: '4px',
    padding: '10px 12px',
    background: '#fffff0',
    border: '1px solid #fefcbf',
    borderRadius: '8px',
  },

  /* ----- Teacher section divider ----- */
  teacherDivider: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#7c3aed',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '16px',
    marginTop: '4px',
    letterSpacing: '-0.2px',
  },

  /* ----- Optional label ----- */
  optional: {
    fontWeight: 400,
    color: '#a0aec0',
    fontSize: '12px',
  },

  /* ----- Submit button ----- */
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
    letterSpacing: '-0.2px',
    boxSizing: 'border-box' as const,
  },

  /* ----- Footer link ----- */
  linkText: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#718096',
  },
  link: {
    color: '#7c3aed',
    textDecoration: 'none',
    fontWeight: 600,
  },

  /* ----- Consent pending screen ----- */
  consentBody: {
    fontSize: '15px',
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 1.7,
    marginBottom: '20px',
    marginTop: 0,
  },
  consentInfoBox: {
    padding: '16px',
    background: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
  },
};
