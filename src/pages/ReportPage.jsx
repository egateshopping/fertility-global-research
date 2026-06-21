import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../i18n.jsx'

export default function ReportPage() {
  const { t } = useLang()
  const [f, setF] = useState({ reported_name: '', reason: '', reporter_email: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.from('reports').insert([f])
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div>
        <h1>{t('report_title')}</h1>
        <div className="auth-ok" style={{ maxWidth: 520 }}>{t('report_sent')}</div>
      </div>
    )
  }

  return (
    <div>
      <h1>{t('report_title')}</h1>
      <form onSubmit={submit} className="report-form">
        <label className="auth-label">{t('report_about')}</label>
        <input className="auth-input" value={f.reported_name}
          onChange={e => setF({ ...f, reported_name: e.target.value })} required />

        <label className="auth-label">{t('report_reason')}</label>
        <textarea className="auth-input" rows="5" value={f.reason}
          onChange={e => setF({ ...f, reason: e.target.value })} required />

        <label className="auth-label">{t('auth_email')}</label>
        <input className="auth-input" type="email" value={f.reporter_email}
          onChange={e => setF({ ...f, reporter_email: e.target.value })} />

        {error && <div className="auth-error">{error}</div>}
        <button className="btn-primary full" disabled={loading}>{t('report_send')}</button>
      </form>
    </div>
  )
}
