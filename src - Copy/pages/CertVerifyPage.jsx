import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function CertVerifyPage({ certNumber }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (certNumber) fetchCert()
  }, [certNumber])

  const fetchCert = async () => {
    const { data: cert } = await supabase
      .from('certificate_requests')
      .select('*, doctors(*)')
      .eq('cert_number', certNumber)
      .eq('status', 'approved')
      .single()

    if (!cert) { setNotFound(true); setLoading(false); return }
    setData(cert)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: 'var(--muted)' }}>Verifying certificate...</p>
    </div>
  )

  if (notFound) return (
    <div style={{ maxWidth: 500, margin: '3rem auto', textAlign: 'center', padding: '1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
      <h2 style={{ color: 'var(--navy)', marginBottom: '.5rem' }}>Certificate Not Found</h2>
      <p style={{ color: 'var(--muted)' }}>No valid certificate found with reference: <strong>{certNumber}</strong></p>
      <p style={{ color: 'var(--muted)', marginTop: '.5rem', fontSize: '.88rem' }}>This may be invalid, expired, or not yet issued.</p>
    </div>
  )

  const doc = data.doctors

  return (
    <div style={{ maxWidth: 620, margin: '2rem auto', padding: '1rem' }}>

      {/* Verified header */}
      <div style={{
        background: 'linear-gradient(135deg, #0B2E5C, #1A8FA8)',
        borderRadius: 14, padding: '1.5rem',
        textAlign: 'center', marginBottom: '1.5rem', color: '#fff'
      }}>
        <img src="/logo.png" alt="" style={{ width: 70, margin: '0 auto .8rem', display: 'block' }} />
        <div style={{ fontSize: '2.5rem', marginBottom: '.4rem' }}>✅</div>
        <h2 style={{ fontFamily: 'Cairo', fontSize: '1.4rem', marginBottom: '.3rem' }}>
          Certificate Verified
        </h2>
        <p style={{ opacity: .85, fontSize: '.9rem' }}>
          This is an official membership certificate issued by Global Fertility Research
        </p>
      </div>

      {/* Certificate details */}
      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--navy)', marginBottom: '1rem', fontFamily: 'Cairo' }}>
          Certificate Details
        </h3>
        <div className="profile-grid">
          {[
            ['Certificate No.', data.cert_number],
            ['Issue Date', data.issued_date],
            ['Status', '✅ Active Member'],
          ].map(([label, value]) => (
            <div key={label} className="profile-field">
              <span className="profile-label">{label}</span>
              <span className="profile-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Member details */}
      <div className="panel" style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--navy)', marginBottom: '1rem', fontFamily: 'Cairo' }}>
          Member Information
        </h3>
        <div className="profile-grid">
          {[
            ['Full Name', `Dr. ${(doc?.full_name || '').trim()}`],
            ['Specialty', doc?.specialty || '—'],
            ['Hospital', doc?.hospital || '—'],
            ['Nationality', doc?.nationality || '—'],
          ].map(([label, value]) => (
            <div key={label} className="profile-field">
              <span className="profile-label">{label}</span>
              <span className="profile-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Issuing body */}
      <div className="panel" style={{ textAlign: 'center', background: 'var(--sky)' }}>
        <p style={{ color: 'var(--navy)', fontWeight: 700, marginBottom: '.3rem' }}>
          Global Fertility Research
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
          Company No: 17263260 · London, United Kingdom
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
          fertility-global.org · contact@fertility-global.org
        </p>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem', marginTop: '1.2rem' }}>
        This certificate was verified online at fertility-global.org on {new Date().toLocaleDateString('en-GB')}
      </p>
    </div>
  )
}
