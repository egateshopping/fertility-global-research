import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../i18n.jsx'
import { COUNTRIES } from '../countries.js'

function EyeButton({ shown, onClick }) {
  return (
    <button type="button" className="eye-btn" onClick={onClick} tabIndex={-1} aria-label="toggle">
      {shown ? '🙈' : '👁️'}
    </button>
  )
}

export function LoginPage({ onSuccess, onSwitchPage, onBack }) {
  const { t, lang } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'reset'
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

  const handleGoogle = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.origin }
    })
    if (error) setError(t('auth_google_off'))
  }

  if (mode === 'reset') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <img src="/logo.png" alt="" className="auth-logo" />
          <h2 className="auth-title">{t('auth_reset_title')}</h2>
          <p className="auth-sub">{t('auth_reset_sub')}</p>
          {resetSent ? (
            <div className="auth-ok">{t('auth_reset_sent')}</div>
          ) : (
            <form onSubmit={handleReset} className="auth-form">
              <input className="auth-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder={t('auth_email')} required />
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn-primary full" disabled={loading}>{t('auth_reset_btn')}</button>
            </form>
          )}
          <button className="auth-back" onClick={() => { setMode('login'); setResetSent(false); setError('') }}>{t('auth_back')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/logo.png" alt="" className="auth-logo" />
        <h2 className="auth-title">{t('auth_login_title')}</h2>
        <p className="auth-sub">Fertility Global Research</p>

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-label">{t('auth_email')}</label>
          <input className="auth-input" type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />

          <label className="auth-label">{t('auth_password')}</label>
          <div className="pw-wrap">
            <input className="auth-input" type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            <EyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
          </div>

          <button type="button" className="auth-forgot" onClick={() => { setMode('reset'); setError('') }}>
            {t('auth_forgot')}
          </button>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? t('auth_login_loading') : t('auth_login_btn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth_no_account')}{' '}
          <button className="auth-link" onClick={onSwitchPage}>{t('auth_create')}</button>
        </p>
        {onBack && <button className="auth-back" onClick={onBack}>{t('auth_back')}</button>}
      </div>
    </div>
  )
}

export function RegisterPage({ onSuccess, onSwitchPage, onBack }) {
  const { t, lang } = useLang()
  const [f, setF] = useState({
    email: '', password: '', passwordConfirm: '', fullName: '', profession: 'doctor',
    specialty: '', hospital: '', clinicAddress: '', phone: '',
    passportNumber: '', nationality: '', yearsOfExperience: '', fertilitySpecialist: false
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
    if (f.password !== f.passwordConfirm) { setError(t('auth_password_mismatch')); return }
    setLoading(true)
    const { data, error: authErr } = await supabase.auth.signUp({ email: f.email, password: f.password })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    const { error: pErr } = await supabase.from('doctors').insert([{
      user_id: data.user.id,
      full_name: f.fullName,
      profession: f.profession,
      specialty: f.specialty,
      hospital: f.hospital,
      clinic_address: f.clinicAddress,
      phone: f.phone,
      email: f.email,
      passport_number: f.passportNumber,
      nationality: f.nationality,
      years_of_experience: f.yearsOfExperience ? parseInt(f.yearsOfExperience) : null,
      fertility_specialist: f.fertilitySpecialist
    }])
    if (pErr) setError(pErr.message)
    else { setDone(true); setTimeout(onSuccess, 1800) }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="auth-card center">
          <img src="/logo.png" alt="" className="auth-logo" />
          <h2 className="auth-title">{t('reg_done')}</h2>
          <p className="auth-sub">{t('reg_redirect')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/logo.png" alt="" className="auth-logo" />
        <h2 className="auth-title">{t('auth_register_title')}</h2>
        <p className="auth-sub">{t('auth_register_sub')}</p>

        <form onSubmit={handleRegister} className="auth-form scroll">
          <input className="auth-input" name="fullName" placeholder={t('reg_name')} value={f.fullName} onChange={ch} required />

          <select className="auth-input" name="profession" value={f.profession} onChange={ch}>
            <option value="doctor">{t('prof_doctor')}</option>
            <option value="pharmacist">{t('prof_pharmacist')}</option>
            <option value="medical">{t('prof_medical')}</option>
          </select>

          <input className="auth-input" name="email" type="email" placeholder={t('auth_email')} value={f.email} onChange={ch} required />

          <div className="pw-wrap">
            <input className="auth-input" name="password" type={showPw ? 'text' : 'password'} placeholder={t('auth_password')} value={f.password} onChange={ch} required />
            <EyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
          </div>
          <div className="pw-wrap">
            <input className="auth-input" name="passwordConfirm" type={showPw2 ? 'text' : 'password'} placeholder={t('auth_password_confirm')} value={f.passwordConfirm} onChange={ch} required />
            <EyeButton shown={showPw2} onClick={() => setShowPw2(s => !s)} />
          </div>

          <input className="auth-input" name="specialty" placeholder={t('reg_specialty')} value={f.specialty} onChange={ch} required />
          <input className="auth-input" name="hospital" placeholder={t('reg_hospital')} value={f.hospital} onChange={ch} required />
          <input className="auth-input" name="clinicAddress" placeholder={t('reg_clinic')} value={f.clinicAddress} onChange={ch} />
          <input className="auth-input" name="phone" type="tel" placeholder={t('reg_phone')} value={f.phone} onChange={ch} />
          <input className="auth-input" name="passportNumber" placeholder={t('reg_passport')} value={f.passportNumber} onChange={ch} required />

          <select className="auth-input" name="nationality" value={f.nationality} onChange={ch} required>
            <option value="">{t('reg_nationality')}</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={lang === 'ar' ? c.ar : c.en}>
                {c.flag} {lang === 'ar' ? c.ar : c.en}
              </option>
            ))}
          </select>

          <input className="auth-input" name="yearsOfExperience" type="number" placeholder={t('reg_years')} value={f.yearsOfExperience} onChange={ch} />
          <label className="auth-check">
            <input type="checkbox" name="fertilitySpecialist" checked={f.fertilitySpecialist} onChange={ch} />
            <span>{t('reg_fertility')}</span>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? t('reg_creating') : t('reg_create_btn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth_have_account')}{' '}
          <button className="auth-link" onClick={onSwitchPage}>{t('auth_login_title')}</button>
        </p>
        {onBack && <button className="auth-back" onClick={onBack}>{t('auth_back')}</button>}
      </div>
    </div>
  )
}

export default { LoginPage, RegisterPage }
