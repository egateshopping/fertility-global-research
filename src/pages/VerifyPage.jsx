import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function VerifyPage({ invNumber }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (invNumber) fetchInvitation()
  }, [invNumber])

  const fetchInvitation = async () => {
    const { data: inv } = await supabase
      .from('invitations')
      .select('*, doctors(*), conferences(*)')
      .eq('invitation_number', invNumber)
      .single()

    if (!inv) { setNotFound(true); setLoading(false); return }
    setData(inv)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: 'var(--muted)' }}>Verifying invitation...</p>
    </div>
  )

  if (notFound) return (
    <div style={{ maxWidth: 500, margin: '3rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
      <h2 style={{ color: 'var(--navy)', marginBottom: '.5rem' }}>Invitation Not Found</h2>
      <p style={{ color: 'var(--muted)' }}>No invitation found with reference: <strong>{invNumber}</strong></p>
      <p style={{ color: 'var(--muted)', marginTop: '.5rem' }}>This may be invalid or expired.</p>
    </div>
  )

  const doc = data.doctors
  const conf = data.conferences

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>

      {/* Verified header */}
      <div style={{
        background: 'linear-gradient(135deg, #0B2E5C, #1A8FA8)',
        borderRadius: 14, padding: '1.5rem',
        textAlign: 'center', marginBottom: '1.5rem', color: '#fff'
      }}>
        <img src="/logo.png" alt="" style={{ width: 70, margin: '0 auto .8rem' }} />
        <div style={{ fontSize: '2rem', marginBottom: '.4rem' }}>✅</div>
        <h2 style={{ fontFamily: 'Cairo', fontSize: '1.4rem', marginBottom: '.3rem' }}>
          Invitation Verified
        </h2>
        <p style={{ opacity: .85, fontSize: '.9rem' }}>
          This is an official invitation from Global Fertility Research
        </p>
      </div>

      {/* Invitation details */}
      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--navy)', marginBottom: '1rem', fontFamily: 'Cairo' }}>
          Invitation Details
        </h3>
        <div className="profile-grid">
          {[
            ['Reference No.', data.invitation_number],
            ['Issue Date', data.issue_date],
            ['Travel Date', data.travel_date || '—'],
            ['Status', data.status === 'issued' ? '✅ Issued' : data.status],
          ].map(([label, value]) => (
            <div key={label} className="profile-field">
              <span className="profile-label">{label}</span>
              <span className="profile-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor details */}
      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--navy)', marginBottom: '1rem', fontFamily: 'Cairo' }}>
          Invited Person
        </h3>
        <div className="profile-grid">
          {[
            ['Full Name', `Dr. ${doc?.full_name || '—'}`],
            ['Specialty', doc?.specialty || '—'],
            ['Hospital', doc?.hospital || '—'],
            ['Nationality', doc?.nationality || '—'],
            ['Passport No.', doc?.passport_number || '—'],
          ].map(([label, value]) => (
            <div key={label} className="profile-field">
              <span className="profile-label">{label}</span>
              <span className="profile-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conference details */}
      <div className="panel">
        <h3 style={{ color: 'var(--navy)', marginBottom: '1rem', fontFamily: 'Cairo' }}>
          Event
        </h3>
        <div className="profile-grid">
          {[
            ['Conference', conf?.title || '—'],
            ['Location', conf?.location || '—'],
            ['Start Date', conf?.start_date || '—'],
            ['End Date', conf?.end_date || '—'],
          ].map(([label, value]) => (
            <div key={label} className="profile-field">
              <span className="profile-label">{label}</span>
              <span className="profile-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.82rem', marginTop: '1.5rem' }}>
        Issued by Global Fertility Research · London, United Kingdom · fertility-global.org
      </p>
    </div>
  )
}
