import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../i18n.jsx'

export function LoginPage({ onSuccess, onSwitchPage, onBack }) {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else onSuccess()
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) setError(t('auth_google_off'))
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
          <input className="auth-input" type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? t('auth_login_loading') : t('auth_login_btn')}
          </button>
        </form>

        <div className="auth-divider"><span>{t('auth_or')}</span></div>

        <button className="btn-google" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.6 5.6C41.9 35.8 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
          {t('auth_google')}
        </button>

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
  const { t } = useLang()
  const [f, setF] = useState({
    email: '', password: '', fullName: '', specialty: '',
    hospital: '', passportNumber: '', nationality: '',
    yearsOfExperience: '', fertilitySpecialist: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const ch = (e) => {
    const { name, value, type, checked } = e.target
    setF(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { data, error: authErr } = await supabase.auth.signUp({
      email: f.email, password: f.password
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    const { error: pErr } = await supabase.from('doctors').insert([{
      user_id: data.user.id,
      full_name: f.fullName,
      specialty: f.specialty,
      hospital: f.hospital,
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
          <input className="auth-input" name="email" type="email" placeholder={t('auth_email')} value={f.email} onChange={ch} required />
          <input className="auth-input" name="password" type="password" placeholder={t('auth_password')} value={f.password} onChange={ch} required />
          <input className="auth-input" name="specialty" placeholder={t('reg_specialty')} value={f.specialty} onChange={ch} required />
          <input className="auth-input" name="hospital" placeholder={t('reg_hospital')} value={f.hospital} onChange={ch} required />
          <input className="auth-input" name="passportNumber" placeholder={t('reg_passport')} value={f.passportNumber} onChange={ch} required />
          <input className="auth-input" name="nationality" placeholder={t('reg_nationality')} value={f.nationality} onChange={ch} required />
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
