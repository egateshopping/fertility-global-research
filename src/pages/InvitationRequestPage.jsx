import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function InvitationRequestPage() {
  const [conferences, setConferences] = useState([])
  const [f, setF] = useState({
    full_name: '', email: '', specialty: '',
    passport_number: '', conference_id: '', message: ''
  })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('conferences').select('*').then(({ data }) => setConferences(data || []))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.from('invitation_requests').insert([f])
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div>
        <h1>Request an Invitation</h1>
        <div className="auth-ok" style={{ maxWidth: 560, marginTop: '1.5rem' }}>
          ✓ Your invitation request has been submitted successfully. The association will review your request and contact you.
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Request an Invitation Letter</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Fill in your details below to request an official invitation letter from Fertility Global Research.
      </p>
      <form onSubmit={submit} className="report-form" style={{ maxWidth: 580 }}>
        <input className="auth-input ltr-input" placeholder="Full Name — as on passport *" dir="ltr"
          value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} required />
        <input className="auth-input ltr-input" type="email" placeholder="Email Address *" dir="ltr"
          value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required />
        <input className="auth-input ltr-input" placeholder="Specialty" dir="ltr"
          value={f.specialty} onChange={e => setF({ ...f, specialty: e.target.value })} />
        <input className="auth-input ltr-input" placeholder="Passport Number *" dir="ltr"
          value={f.passport_number} onChange={e => setF({ ...f, passport_number: e.target.value })} required />
        <select className="auth-input" value={f.conference_id}
          onChange={e => setF({ ...f, conference_id: e.target.value })}>
          <option value="">Select Conference (optional)</option>
          {conferences.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <textarea className="auth-input" rows="4" placeholder="Additional message (optional)"
          value={f.message} onChange={e => setF({ ...f, message: e.target.value })} />
        {error && <div className="auth-error">{error}</div>}
        <button className="btn-primary full" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
