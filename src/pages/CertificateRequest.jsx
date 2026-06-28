import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function CertificateRequest({ doctor }) {
  const [requests, setRequests] = useState([])
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (doctor?.id) fetchRequests()
  }, [doctor])

  const fetchRequests = async () => {
    const { data } = await supabase.from('certificate_requests')
      .select('*').eq('doctor_id', doctor.id).order('created_at', { ascending: false })
    setRequests(data || [])
  }

  const requestCertificate = async () => {
    setLoading(true)
    const { error } = await supabase.from('certificate_requests').insert([{
      doctor_id: doctor.id, status: 'pending'
    }])
    if (!error) { setSent(true); fetchRequests() }
    setLoading(false)
  }

  const statusLabel = (s) => {
    if (s === 'pending') return '⏳ Pending Review'
    if (s === 'approved') return '✅ Approved'
    if (s === 'rejected') return '❌ Rejected'
    return s
  }

  return (
    <div className="panel" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>🎓 Membership Certificate</h3>
      <p className="muted" style={{ marginBottom: '1rem' }}>
        Request an official membership certificate from Global Fertility Research.
      </p>

      {requests.length === 0 ? (
        <button className="btn-primary" onClick={requestCertificate} disabled={loading}>
          {loading ? 'Submitting...' : 'Request Certificate'}
        </button>
      ) : (
        <div>
          {requests.map(r => (
            <div key={r.id} className="event-card" style={{ marginBottom: '.8rem' }}>
              <p><strong>Status:</strong> {statusLabel(r.status)}</p>
              <p className="muted">Requested: {(r.created_at || '').split('T')[0]}</p>
              {r.issued_date && <p><strong>Issued:</strong> {r.issued_date}</p>}
            </div>
          ))}
          <button className="btn-soft" onClick={requestCertificate} disabled={loading} style={{ marginTop: '.5rem' }}>
            Request Again
          </button>
        </div>
      )}
    </div>
  )
}
