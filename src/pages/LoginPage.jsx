import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../i18n.jsx'
import { COUNTRIES } from '../countries.js'
import { notifyRegistration } from '../utils/notifications.js'

const BUCKET = 'doctor-documents'

function EyeButton({ shown, onClick }) {
  return (
    <button type="button" className="eye-btn" onClick={onClick} tabIndex={-1}>
      {shown ? '🙈' : '👁️'}
    </button>
  )
}

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

// ── LOGIN PAGE ──────────────────────────────────────────────────────────────
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
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
            ? <div className="auth-ok">Reset link sent ✓</div>
            : (
              <form onSubmit={handleReset} className="auth-form">
                <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                {error && <div className="auth-error">{error}</div>}
                <button type="submit" className="btn-primary full" disabled={loading}>Send Reset Link</button>
              </form>
            )
          }
          <button className="auth-back" onClick={() => { setMode('login'); setResetSent(false); setError('') }}>← Back</button>
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
          <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          <label className="auth-label">{t('auth_password')}</label>
          <div className="pw-wrap">
            <input className="auth-input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            <EyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
          </div>
          <button type="button" className="auth-forgot" onClick={() => { setMode('reset'); setError('') }}>Forgot password?</button>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-primary full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        {onSwitchPage && (
          <p className="auth-switch">Don't have an account?{' '}<button className="auth-link" onClick={onSwitchPage}>Create account</button></p>
        )}
        {onBack && <button className="auth-back" onClick={onBack}>← Back to site</button>}
      </div>
    </div>
  )
}

// ── REGISTER PAGE (Multi-step) ──────────────────────────────────────────────
export function RegisterPage({ onSuccess, onSwitchPage, onBack }) {
  const [step, setStep] = useState(1)
  const [f, setF] = useState({
    email: '', password: '', passwordConfirm: '',
    fullName: '', phone: '',
    profession: 'doctor', specialty: '', hospital: '',
    clinicAddress: '', passportNumber: '', syndicateId: '',
    nationality: '', city: '', governorate: '',
    dateOfBirth: '', syndicateJoinDate: '', address: '',
    fertilitySpecialist: false, agreeTerms: false
  })
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [passportFile, setPassportFile] = useState(null)
  const [syndicateFile, setSyndicateFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const ch = (e) => {
    const { name, value, type, checked } = e.target
    setF(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  // Step validation
  const validateStep1 = () => {
    if (!f.fullName.trim()) return 'Full name is required'
    if (!f.email.trim()) return 'Email is required'
    if (!f.password || f.password.length < 8) return 'Password must be at least 8 characters'
    if (f.password !== f.passwordConfirm) return 'Passwords do not match'
    return null
  }

  const validateStep2 = () => {
    if (!f.specialty.trim()) return 'Specialty is required'
    if (!f.hospital.trim()) return 'Hospital / Workplace is required'
    if (!f.passportNumber.trim()) return 'Passport number is required'
    if (!f.nationality) return 'Nationality is required'
    if (!f.city.trim()) return 'City is required'
    if (!f.agreeTerms) return 'You must agree to the terms and conditions'
    return null
  }

  const validateStep3 = () => {
    if (!passportFile) return 'Passport copy is required'
    if (!syndicateFile) return 'Syndicate / Union card is required'
    return null
  }

  const nextStep = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1(); if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2(); if (err) { setError(err); return }
    }
    setStep(s => s + 1)
  }

  const compressImage = (file, maxW = 1500, quality = 0.7) =>
    new Promise((resolve) => {
      if (file.type === 'application/pdf') { resolve(file); return }
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > maxW) { height = Math.round(height * maxW / width); width = maxW }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          canvas.toBlob(blob => {
            resolve(blob && blob.size < file.size
              ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
              : file)
          }, 'image/jpeg', quality)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const err = validateStep3(); if (err) { setError(err); return }
    setLoading(true)

    try {
      // 1) Create auth account
      const { data, error: authErr } = await supabase.auth.signUp({ email: f.email, password: f.password })
      if (authErr) { setError(authErr.message); setLoading(false); return }
      const userId = data?.user?.id
      if (!userId) { setError('Registration failed. Please try again.'); setLoading(false); return }

      // 2) Insert doctor record
      const { error: pErr } = await supabase.from('doctors').insert([{
        user_id: userId,
        full_name: f.fullName.trim(),
        email: f.email,
        profession: f.profession,
        specialty: f.specialty,
        hospital: f.hospital,
        clinic_address: f.clinicAddress || null,
        phone: f.phone || null,
        passport_number: f.passportNumber,
        syndicate_id: f.syndicateId || null,
        nationality: f.nationality,
        city: f.city,
        governorate: f.governorate || null,
        date_of_birth: f.dateOfBirth || null,
        syndicate_join_date: f.syndicateJoinDate || null,
        address: f.address || null,
        fertility_specialist: f.fertilitySpecialist,
        status: 'pending',
        is_admin: false
      }])
      if (pErr) { setError('Profile save failed: ' + pErr.message); setLoading(false); return }

      // 3) Get doctor id
      const { data: docData } = await supabase.from('doctors').select('id').eq('user_id', userId).single()
      const doctorId = docData?.id

      // 4) Upload documents
      if (doctorId) {
        const uploadDoc = async (file, type) => {
          const compressed = await compressImage(file)
          const ext = compressed.name ? compressed.name.split('.').pop() : 'jpg'
          const path = `${doctorId}/${type}.${ext}`
          await supabase.storage.from(BUCKET).upload(path, compressed, { upsert: true })
          await supabase.from('documents').insert([{ doctor_id: doctorId, document_type: type, file_url: path }])
        }
        await uploadDoc(passportFile, 'passport')
        await uploadDoc(syndicateFile, 'syndicate')
      }

      setDone(true)
      // Send confirmation email (non-blocking)
      notifyRegistration(f.email, f.fullName.trim())
      setTimeout(onSuccess, 2000)
    } catch (err) {
      setError('Unexpected error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="auth-card center">
          <img src="/logo.png" alt="" className="auth-logo" />
          <div style={{ fontSize: '3rem', margin: '1rem 0' }}>✅</div>
          <h2 className="auth-title">Registration Complete</h2>
          <p className="auth-sub">Your application has been submitted. The administration will review your documents and notify you upon approval.</p>
        </div>
      </div>
    )
  }

  const strength = getPasswordStrength(f.password)

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/logo.png" alt="" className="auth-logo" />
        <h2 className="auth-title">Create Account</h2>

        {/* Step indicator */}
        <div className="reg-steps">
          {['Personal', 'Professional', 'Documents'].map((label, i) => (
            <div key={i} className={`reg-step ${step === i+1 ? 'active' : step > i+1 ? 'done' : ''}`}>
              <div className="reg-step-num">{step > i+1 ? '✓' : i+1}</div>
              <div className="reg-step-label">{label}</div>
            </div>
          ))}
        </div>

        {/* STEP 1 — Personal */}
        {step === 1 && (
          <div className="auth-form scroll">
            <div className="en-notice">⚠️ Please fill all fields in <strong>English</strong>, exactly as on your passport.</div>
            <div className="reg-section">Personal Information</div>
            <input className="auth-input ltr-input" name="fullName" placeholder="Full Name — as on passport *" value={f.fullName} onChange={ch} dir="ltr" />
            <input className="auth-input ltr-input" name="email" type="email" placeholder="Email Address *" value={f.email} onChange={ch} dir="ltr" />
            <input className="auth-input ltr-input" name="phone" type="tel" placeholder="Phone Number" value={f.phone} onChange={ch} dir="ltr" />
            <div className="pw-wrap">
              <input className="auth-input ltr-input" name="password" type={showPw ? 'text' : 'password'} placeholder="Password * (min. 8 characters)" value={f.password} onChange={ch} minLength={8} dir="ltr" />
              <EyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
            </div>
            {f.password && (
              <div className="pw-strength">
                <div className="pw-strength-bar">
                  <div style={{ width: strength.level === 1 ? '33%' : strength.level === 2 ? '66%' : '100%', background: strength.color, height: '100%', borderRadius: 4, transition: 'all .3s' }} />
                </div>
                <span style={{ color: strength.color, fontSize: '.82rem', fontWeight: 700 }}>{strength.label}</span>
              </div>
            )}
            <div className="pw-wrap">
              <input className="auth-input ltr-input" name="passwordConfirm" type={showPw2 ? 'text' : 'password'} placeholder="Confirm Password *" value={f.passwordConfirm} onChange={ch} dir="ltr" />
              <EyeButton shown={showPw2} onClick={() => setShowPw2(s => !s)} />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="button" className="btn-primary full" onClick={nextStep}>Next →</button>
          </div>
        )}

        {/* STEP 2 — Professional */}
        {step === 2 && (
          <div className="auth-form scroll">
            <div className="reg-section">Professional Information</div>
            <select className="auth-input" name="profession" value={f.profession} onChange={ch}>
              <option value="doctor">Doctor</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="medical">Other Medical Profession</option>
            </select>
            <input className="auth-input ltr-input" name="specialty" placeholder="Specialty *" value={f.specialty} onChange={ch} dir="ltr" />
            <input className="auth-input ltr-input" name="hospital" placeholder="Hospital / Workplace *" value={f.hospital} onChange={ch} dir="ltr" />
            <input className="auth-input ltr-input" name="clinicAddress" placeholder="Clinic Address" value={f.clinicAddress} onChange={ch} dir="ltr" />

            <div className="reg-section">Identity</div>
            <input className="auth-input ltr-input" name="passportNumber" placeholder="Passport Number *" value={f.passportNumber} onChange={ch} dir="ltr" />
            <input className="auth-input ltr-input" name="syndicateId" placeholder="Syndicate / Union ID" value={f.syndicateId} onChange={ch} dir="ltr" />
            <select className="auth-input" name="nationality" value={f.nationality} onChange={ch} required>
              <option value="">Select Nationality *</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.en}>{c.flag} {c.en}</option>)}
            </select>
            <input className="auth-input ltr-input" name="city" placeholder="City *" value={f.city} onChange={ch} dir="ltr" />
            <input className="auth-input ltr-input" name="governorate" placeholder="Governorate / Province" value={f.governorate} onChange={ch} dir="ltr" />
            <input className="auth-input ltr-input" name="address" placeholder="Home / Work Address" value={f.address} onChange={ch} dir="ltr" />
            <label className="auth-label-sm">Date of Birth</label>
            <input className="auth-input ltr-input" name="dateOfBirth" type="date" value={f.dateOfBirth} onChange={ch} dir="ltr" />
            <label className="auth-label-sm">Syndicate Join Date</label>
            <input className="auth-input ltr-input" name="syndicateJoinDate" type="date" value={f.syndicateJoinDate} onChange={ch} dir="ltr" />
            <label className="auth-check">
              <input type="checkbox" name="fertilitySpecialist" checked={f.fertilitySpecialist} onChange={ch} />
              <span>Fertility Specialist</span>
            </label>
            <div className="terms-box">
              <label className="auth-check terms-check">
                <input type="checkbox" name="agreeTerms" checked={f.agreeTerms} onChange={ch} />
                <span>I agree to share my information in the association's directory. I acknowledge that <strong>Global Fertility Research is not responsible</strong> for visa decisions made by any authority. I accept the <a href="#terms" className="auth-link" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('goto', {detail:'terms'})) }}>Terms & Conditions</a>.</span>
              </label>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div style={{ display: 'flex', gap: '.8rem' }}>
              <button type="button" className="btn-soft" onClick={() => { setStep(1); setError('') }}>← Back</button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={nextStep}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Documents */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="reg-section">Required Documents</div>
            <p className="muted" style={{ fontSize: '.88rem', marginBottom: '.5rem' }}>
              Both documents are <strong>mandatory</strong> before your application can be submitted.
            </p>

            {/* Passport */}
            <div className={`doc-upload-box ${passportFile ? 'doc-upload-box--done' : ''}`}>
              <div className="doc-upload-icon">🛂</div>
              <div className="doc-upload-info">
                <strong>Passport Copy *</strong>
                <p className="muted" style={{ fontSize: '.82rem' }}>
                  {passportFile ? `✅ ${passportFile.name} (${Math.round(passportFile.size/1024)}KB)` : 'JPG, PNG or PDF — max 15MB'}
                </p>
              </div>
              <label className="doc-upload-btn" style={{ cursor: 'pointer' }}>
                {passportFile ? '🔄 Change' : '⬆ Upload'}
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                  onChange={e => setPassportFile(e.target.files[0])} />
              </label>
            </div>

            {/* Syndicate */}
            <div className={`doc-upload-box ${syndicateFile ? 'doc-upload-box--done' : ''}`}>
              <div className="doc-upload-icon">🏥</div>
              <div className="doc-upload-info">
                <strong>Syndicate / Union Card *</strong>
                <p className="muted" style={{ fontSize: '.82rem' }}>
                  {syndicateFile ? `✅ ${syndicateFile.name} (${Math.round(syndicateFile.size/1024)}KB)` : 'JPG, PNG or PDF — max 15MB'}
                </p>
              </div>
              <label className="doc-upload-btn" style={{ cursor: 'pointer' }}>
                {syndicateFile ? '🔄 Change' : '⬆ Upload'}
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                  onChange={e => setSyndicateFile(e.target.files[0])} />
              </label>
            </div>

            {!passportFile || !syndicateFile ? (
              <div className="auth-error" style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404' }}>
                ⚠️ Both documents are required to submit your application.
              </div>
            ) : (
              <div className="auth-ok">✅ Both documents uploaded — ready to submit</div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <div style={{ display: 'flex', gap: '.8rem' }}>
              <button type="button" className="btn-soft" onClick={() => { setStep(2); setError('') }}>← Back</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}
                disabled={loading || !passportFile || !syndicateFile}>
                {loading ? 'Submitting...' : '📨 Submit Application'}
              </button>
            </div>
          </form>
        )}

        <p className="auth-switch" style={{ marginTop: '1rem' }}>
          Already have an account?{' '}
          <button className="auth-link" onClick={onSwitchPage}>Sign In</button>
        </p>
        {onBack && <button className="auth-back" onClick={onBack}>← Back to site</button>}
      </div>
    </div>
  )
}

export default { LoginPage, RegisterPage }
