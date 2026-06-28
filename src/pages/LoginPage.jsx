import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../i18n.jsx'
import { COUNTRIES } from '../countries.js'


function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: 1, label: 'Weak', color: '#e74c3c' }
  if (score <= 3) return { level: 2, label: 'Medium', color: '#f39c12' }
  return { level: 3, label: 'Strong', color: '#27ae60' }
}

function EyeButton({ shown, onClick }) {
  return (
    <button type="button" className="eye-btn" onClick={onClick} tabIndex={-1}>
      {shown ? '🙈' : '👁️'}
    </button>
  )
}

export function LoginPage({ onSuccess, onSwitchPage, onBack }) {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else onSuccess()
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  if (mode === 'reset') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <img src="/logo.png" alt="" className="auth-logo" />
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-sub">Enter your email to receive a reset link</p>
          {resetSent
            ? <div className="auth-ok">Reset link sent to your email ✓</div>
            : (
              <form onSubmit={handleReset} className="auth-form">
                <input className="auth-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" className="btn-primary full" disabled={loading}>Send Reset Link</button>
              </form>
            )}
          <button className="auth-back" onClick={() => { setMode('login'); setResetSent(false); setError('') }}>← Back to login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/logo.png" alt="" className="auth-logo" />
        <h2 className="auth-title">{t('auth_login_title')}</h2>
        <p className="auth-sub">Global Fertility Research</p>

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-label">{t('auth_email')}</label>
          <input className="auth-input" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />

          <label className="auth-label">{t('auth_password')}</label>
          <div className="pw-wrap">
            <input className="auth-input" type={showPw ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
            <EyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
          </div>

          <button type="button" className="auth-forgot"
            onClick={() => { setMode('reset'); setError('') }}>
            Forgot password?
          </button>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {onSwitchPage && (
          <p className="auth-switch">
            Don't have an account?{' '}
            <button className="auth-link" onClick={onSwitchPage}>Create account</button>
          </p>
        )}
        {onBack && <button className="auth-back" onClick={onBack}>← Back to site</button>}
      </div>
    </div>
  )
}

export function RegisterPage({ onSuccess, onSwitchPage, onBack }) {
  const [f, setF] = useState({
    email: '', password: '', passwordConfirm: '',
    fullName: '', profession: 'doctor', specialty: '',
    hospital: '', clinicAddress: '', phone: '',
    passportNumber: '', syndicateId: '',
    nationality: '', city: '', governorate: '',
    dateOfBirth: '', syndicateJoinDate: '', address: '',
    fertilitySpecialist: false,
    agreeTerms: false
  })
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const ch = (e) => {
    const { name, value, type, checked } = e.target
    setF(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (f.password !== f.passwordConfirm) { setError('Passwords do not match'); return }
    if (!f.agreeTerms) { setError('Please agree to the terms and conditions'); return }
    setLoading(true)

    const { data, error: authErr } = await supabase.auth.signUp({ email: f.email, password: f.password })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    // data.user can be null if email confirmation is on
    const userId = data?.user?.id
    if (!userId) {
      setError('Registration failed. Please try again or contact support.')
      setLoading(false)
      return
    }

    const { error: pErr } = await supabase.from('doctors').insert([{
      user_id: userId,
      full_name: f.fullName,
      profession: f.profession || 'doctor',
      specialty: f.specialty,
      hospital: f.hospital,
      clinic_address: f.clinicAddress || null,
      phone: f.phone || null,
      email: f.email,
      passport_number: f.passportNumber || null,
      syndicate_id: f.syndicateId || null,
      nationality: f.nationality || null,
      city: f.city || null,
      governorate: f.governorate || null,
      date_of_birth: f.dateOfBirth || null,
      syndicate_join_date: f.syndicateJoinDate || null,
      address: f.address || null,
      fertility_specialist: f.fertilitySpecialist || false,
      status: 'pending',
      is_admin: false
    }])

    if (pErr) {
      console.error('Profile insert error:', pErr)
      setError(`Profile save failed: ${pErr.message}. Please contact support.`)
    }
    else { setDone(true); setTimeout(onSuccess, 1800) }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="auth-card center">
          <img src="/logo.png" alt="" className="auth-logo" />
          <h2 className="auth-title">Account Created ✓</h2>
          <p className="auth-sub">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/logo.png" alt="" className="auth-logo" />
        <h2 className="auth-title">Create Doctor Account</h2>
        <p className="auth-sub">Register your details to join</p>

        <form onSubmit={handleRegister} className="auth-form scroll">

          {/* English notice */}
          <div className="en-notice">
            ⚠️ Please fill all fields in <strong>English</strong>, exactly as they appear on your passport.
          </div>

          {/* Personal */}
          <div className="reg-section">Personal Information</div>
          <input className="auth-input ltr-input" name="fullName"
            placeholder="Full Name — as on passport *"
            value={f.fullName} onChange={ch} required dir="ltr" />
          <input className="auth-input" name="email" type="email" placeholder="Email Address *" value={f.email} dir="ltr" onChange={ch} required />

          <div className="pw-wrap">
            <input className="auth-input" name="password" type={showPw ? 'text' : 'password'}
              placeholder="Password * (min. 8 characters)" value={f.password} onChange={ch} required minLength={8} />
            <EyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
          </div>
          {f.password && (() => {
            const s = getPasswordStrength(f.password)
            return (
              <div className="pw-strength">
                <div className="pw-strength-bar">
                  <div style={{ width: s.level === 1 ? '33%' : s.level === 2 ? '66%' : '100%', background: s.color, height: '100%', borderRadius: 4, transition: 'all .3s' }} />
                </div>
                <span style={{ color: s.color, fontSize: '.82rem', fontWeight: 700 }}>{s.label}</span>
              </div>
            )
          })()}
          <div className="pw-wrap">
            <input className="auth-input" name="passwordConfirm" type={showPw2 ? 'text' : 'password'}
              placeholder="Confirm Password *" value={f.passwordConfirm} onChange={ch} required />
            <EyeButton shown={showPw2} onClick={() => setShowPw2(s => !s)} />
          </div>

          <input className="auth-input" name="phone" type="tel" placeholder="Phone Number" value={f.phone} dir="ltr" onChange={ch} />

          {/* Professional */}
          <div className="reg-section">Professional Information</div>
          <select className="auth-input" name="profession" value={f.profession} onChange={ch}>
            <option value="doctor">Doctor</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="medical">Other Medical Profession</option>
          </select>
          <input className="auth-input" name="specialty" placeholder="Specialty *" value={f.specialty} dir="ltr" onChange={ch} required />
          <input className="auth-input" name="hospital" placeholder="Hospital / Workplace *" value={f.hospital} dir="ltr" onChange={ch} required />
          <input className="auth-input" name="clinicAddress" placeholder="Clinic Address" value={f.clinicAddress} dir="ltr" onChange={ch} />
          <label className="auth-label-sm">Date of Birth</label>
          <input className="auth-input ltr-input" name="dateOfBirth" type="date" value={f.dateOfBirth} onChange={ch} dir="ltr" />
          <label className="auth-label-sm">Syndicate Join Date</label>
          <input className="auth-input ltr-input" name="syndicateJoinDate" type="date" value={f.syndicateJoinDate} onChange={ch} dir="ltr" />
          <input className="auth-input ltr-input" name="address" placeholder="Home / Work Address" value={f.address} onChange={ch} dir="ltr" />

          {/* Identity */}
          <div className="reg-section">Identity Documents</div>
          <input className="auth-input" name="passportNumber" placeholder="Passport Number *" value={f.passportNumber} dir="ltr" onChange={ch} required />
          <input className="auth-input" name="syndicateId" placeholder="Syndicate / Union ID Number" value={f.syndicateId} dir="ltr" onChange={ch} />

          <select className="auth-input" name="nationality" value={f.nationality} onChange={ch} required>
            <option value="">Select Nationality *</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.en}>{c.flag} {c.en}</option>
            ))}
          </select>

          <input className="auth-input" name="city" placeholder="City *" value={f.city} dir="ltr" onChange={ch} required />
          <input className="auth-input" name="governorate" placeholder="Governorate / Province" value={f.governorate} dir="ltr" onChange={ch} />

          <label className="auth-check">
            <input type="checkbox" name="fertilitySpecialist" checked={f.fertilitySpecialist} onChange={ch} />
            <span>Fertility Specialist</span>
          </label>

          {/* Terms */}
          <div className="terms-box">
            <label className="auth-check terms-check">
              <input type="checkbox" name="agreeTerms" checked={f.agreeTerms} onChange={ch} />
              <span>
                I agree to share my information in the association's directory. I acknowledge that <strong>Global Fertility Research is not responsible</strong> for visa decisions made by any authority.{' '}
                <a href="#terms" className="auth-link" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('goto', {detail:'terms'})) }}>View full Terms & Conditions</a>
              </span>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button className="auth-link" onClick={onSwitchPage}>Sign In</button>
        </p>
        {onBack && <button className="auth-back" onClick={onBack}>← Back to site</button>}
      </div>
    </div>
  )
}

export default { LoginPage, RegisterPage }
