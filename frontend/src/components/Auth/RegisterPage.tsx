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
  const [showPassword, setShowPassword] = useState(false);
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

  const PasswordIndicator = ({ met, label }: { met: boolean; label: string }) => (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: met ? '#0d9488' : '#94a3b8',
      fontSize: '12px',
      lineHeight: '1.6',
    }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        backgroundColor: met ? '#0d9488' : 'transparent',
        border: met ? 'none' : '1.5px solid #cbd5e1',
        color: met ? '#fff' : '#cbd5e1',
        fontSize: '9px',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {met ? '\u2713' : ''}
      </span>
      {label}
    </span>
  );

  if (consentPending) {
    return (
      <>
        <style>{`
          @media (max-width: 768px) {
            .register-left-panel { display: none !important; }
            .register-split-layout { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div className="register-split-layout" style={styles.splitLayout}>
          {/* Left brand panel */}
          <div className="register-left-panel" style={styles.leftPanel}>
            <div style={styles.brandContent}>
              <h1 style={styles.brandTitle}>
                Kyro<span style={{ color: '#0d9488' }}>Academy</span>
              </h1>
              <p style={styles.brandTagline}>Where curious minds find expert guidance</p>
              <div style={styles.featureList}>
                <div style={styles.featureCard}>
                  <div style={styles.featureIconBox}>{'\uD83C\uDF93'}</div>
                  <div>
                    <div style={styles.featureCardTitle}>Expert-Led Courses</div>
                    <div style={styles.featureCardDesc}>Structured learning from verified Kyro Guides</div>
                  </div>
                </div>
                <div style={styles.featureCard}>
                  <div style={styles.featureIconBox}>{'\uD83C\uDFA5'}</div>
                  <div>
                    <div style={styles.featureCardTitle}>Live Interactive Classes</div>
                    <div style={styles.featureCardDesc}>Real-time video sessions with chat & collaboration</div>
                  </div>
                </div>
                <div style={styles.featureCard}>
                  <div style={styles.featureIconBox}>{'\uD83D\uDCC8'}</div>
                  <div>
                    <div style={styles.featureCardTitle}>Track Your Progress</div>
                    <div style={styles.featureCardDesc}>Quizzes, assignments, and certificates</div>
                  </div>
                </div>
              </div>
              <div style={styles.statsRow}>
                <div style={styles.statItem}><span style={styles.statValue}>2,500+</span><span style={styles.statLabel}>Learners</span></div>
                <div style={styles.statItem}><span style={styles.statValue}>180+</span><span style={styles.statLabel}>Courses</span></div>
                <div style={styles.statItem}><span style={styles.statValue}>4.8</span><span style={styles.statLabel}>Rating</span></div>
              </div>
            </div>
          </div>

          {/* Right content panel */}
          <div style={styles.rightPanel}>
            <div style={styles.formContainer}>
              <div style={{ textAlign: 'center' as const }}>
                <h1 style={styles.formBrand}>
                  Kyro<span style={{ color: '#0d9488' }}>Academy</span>
                </h1>
                <h2 style={styles.consentTitle}>Parental Consent Required</h2>

                <div style={styles.consentIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>

                <p style={{ marginBottom: '16px', color: '#334155', fontSize: '15px', lineHeight: '1.6' }}>
                  Your account has been created, but since you are under 13, we need your parent or guardian's permission before you can use the platform.
                </p>
                <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                  We've sent an email to <strong style={{ color: '#0d9488' }}>{parentEmail}</strong> with a link to approve your account.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
                  Once your parent/guardian approves, you can log in and start learning.
                </p>
                <Link to="/login" style={styles.submitButton}>
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .register-left-panel { display: none !important; }
          .register-split-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="register-split-layout" style={styles.splitLayout}>
        {/* Left brand panel */}
        <div className="register-left-panel" style={styles.leftPanel}>
          <div style={styles.brandContent}>
            <h1 style={styles.brandTitle}>
              Kyro<span style={{ color: '#0d9488' }}>Academy</span>
            </h1>
            <p style={styles.brandTagline}>Where curious minds find expert guidance</p>
            <div style={styles.featureList}>
                <div style={styles.featureCard}>
                  <div style={styles.featureIconBox}>{'\uD83C\uDF93'}</div>
                  <div>
                    <div style={styles.featureCardTitle}>Expert-Led Courses</div>
                    <div style={styles.featureCardDesc}>Structured learning from verified Kyro Guides</div>
                  </div>
                </div>
                <div style={styles.featureCard}>
                  <div style={styles.featureIconBox}>{'\uD83C\uDFA5'}</div>
                  <div>
                    <div style={styles.featureCardTitle}>Live Interactive Classes</div>
                    <div style={styles.featureCardDesc}>Real-time video sessions with chat & collaboration</div>
                  </div>
                </div>
                <div style={styles.featureCard}>
                  <div style={styles.featureIconBox}>{'\uD83D\uDCC8'}</div>
                  <div>
                    <div style={styles.featureCardTitle}>Track Your Progress</div>
                    <div style={styles.featureCardDesc}>Quizzes, assignments, and certificates</div>
                  </div>
                </div>
              </div>
              <div style={styles.statsRow}>
                <div style={styles.statItem}><span style={styles.statValue}>2,500+</span><span style={styles.statLabel}>Learners</span></div>
                <div style={styles.statItem}><span style={styles.statValue}>180+</span><span style={styles.statLabel}>Courses</span></div>
                <div style={styles.statItem}><span style={styles.statValue}>4.8</span><span style={styles.statLabel}>Rating</span></div>
              </div>
          </div>
        </div>

        {/* Right form panel */}
        <div style={styles.rightPanel}>
          <div style={styles.formContainer}>
            <h1 style={styles.formBrand}>
              Kyro<span style={{ color: '#0d9488' }}>Academy</span>
            </h1>
            <h2 style={styles.formTitle}>Create your account</h2>

            {error && <div style={styles.error}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-up failed')}
                text="signup_with"
              />
            </div>

            <div style={styles.dividerLine}>
              <hr style={styles.dividerHr} />
              <span style={styles.dividerLineText}>or register with email</span>
              <hr style={styles.dividerHr} />
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
                <div style={{ position: 'relative' as const }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ ...styles.input, paddingRight: '60px' }}
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordBtn}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div style={styles.passwordHints}>
                  <PasswordIndicator met={password.length >= 8} label="At least 8 characters" />
                  <PasswordIndicator met={/[a-z]/.test(password)} label="Lowercase letter" />
                  <PasswordIndicator met={/[A-Z]/.test(password)} label="Uppercase letter" />
                  <PasswordIndicator met={/\d/.test(password)} label="Number" />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <div style={styles.roleGroup}>
                  <label
                    style={{
                      ...styles.rolePill,
                      ...(role === 'STUDENT' ? styles.rolePillActive : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="STUDENT"
                      checked={role === 'STUDENT'}
                      onChange={() => setRole('STUDENT')}
                      style={styles.srOnly}
                    />
                    <span style={styles.rolePillEmoji}>{'\uD83D\uDCD6'}</span>
                    Kyro Learner
                  </label>
                  <label
                    style={{
                      ...styles.rolePill,
                      ...(role === 'TEACHER' ? styles.rolePillActive : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="TEACHER"
                      checked={role === 'TEACHER'}
                      onChange={() => setRole('TEACHER')}
                      style={styles.srOnly}
                    />
                    <span style={styles.rolePillEmoji}>{'\uD83C\uDF93'}</span>
                    Kyro Guide
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
                  <div style={styles.coppaBox}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>Required for users under 13 (COPPA compliance). Your parent/guardian will receive an email to approve your account.</span>
                  </div>
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
                  <div style={styles.sectionDivider}>Kyro Guide Details</div>
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

              <button type="submit" disabled={isSubmitting} style={styles.submitButton}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p style={styles.linkText}>
              Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  /* ── Split layout ── */
  splitLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: '100vh',
  },

  /* ── Left brand panel ── */
  leftPanel: {
    background: `radial-gradient(ellipse at 30% 50%, rgba(13,148,136,0.1) 0%, #0f172a 70%)`,
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    position: 'relative' as const,
  },
  brandContent: {
    color: '#fff',
    maxWidth: '360px',
    width: '100%',
  },
  brandTitle: {
    fontSize: '32px',
    fontWeight: 800,
    marginBottom: '12px',
    letterSpacing: '-0.5px',
    color: '#fff',
  },
  brandTagline: {
    fontSize: '16px',
    color: '#94a3b8',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  featureCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  featureIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(13,148,136,0.15)',
    fontSize: '20px',
    flexShrink: 0,
  },
  featureCardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '2px',
  },
  featureCardDesc: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    marginTop: '32px',
    paddingTop: '24px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0d9488',
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },

  /* ── Right form panel ── */
  rightPanel: {
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 24px',
    overflowY: 'auto' as const,
    minHeight: '100vh',
  },
  formContainer: {
    width: '100%',
    maxWidth: '440px',
    paddingTop: '16px',
    paddingBottom: '40px',
  },
  formBrand: {
    fontSize: '26px',
    fontWeight: 800,
    textAlign: 'center' as const,
    marginBottom: '4px',
    color: '#0f172a',
    letterSpacing: '-0.3px',
  },
  formTitle: {
    textAlign: 'center' as const,
    marginBottom: '28px',
    fontWeight: 500,
    fontSize: '16px',
    color: '#64748b',
  },
  consentTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '24px',
  },
  consentIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(13,148,136,0.08)',
    margin: '0 auto 24px',
  },

  /* ── Divider line ── */
  dividerLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  dividerHr: {
    flex: 1,
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: 0,
  },
  dividerLineText: {
    fontSize: '13px',
    color: '#94a3b8',
    whiteSpace: 'nowrap' as const,
  },

  /* ── Form ── */
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center' as const,
    fontSize: '14px',
    border: '1px solid #fecaca',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#1e293b',
  },
  input: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  showPasswordBtn: {
    position: 'absolute' as const,
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  passwordHints: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
    marginTop: '8px',
  },

  /* ── Role pills ── */
  roleGroup: {
    display: 'flex',
    gap: '10px',
    padding: '4px 0',
  },
  rolePill: {
    display: 'inline-flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: 1,
    textAlign: 'center' as const,
    backgroundColor: '#fff',
    gap: '4px',
  },
  rolePillActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
    color: '#fff',
    fontWeight: 600,
  },
  rolePillEmoji: {
    fontSize: '20px',
    lineHeight: 1,
  },

  /* ── COPPA info box ── */
  coppaBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#fffbeb',
    borderRadius: '8px',
    border: '1px solid #fef3c7',
    fontSize: '12px',
    color: '#92400e',
    lineHeight: '1.5',
    marginTop: '4px',
  },

  /* ── Section divider ── */
  sectionDivider: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0d9488',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '16px',
    marginTop: '4px',
  },

  /* ── Submit button ── */
  submitButton: {
    padding: '14px',
    background: 'linear-gradient(135deg, #0f766e, #0d9488)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'block',
    transition: 'all 0.2s',
  },

  /* ── Footer link ── */
  linkText: {
    textAlign: 'center' as const,
    marginTop: '24px',
    color: '#64748b',
    fontSize: '14px',
  },
  link: {
    color: '#0d9488',
    textDecoration: 'none',
    fontWeight: 600,
  },
  optional: {
    fontWeight: 'normal' as const,
    color: '#94a3b8',
    fontSize: '12px',
  },
  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  },
};
