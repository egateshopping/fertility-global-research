import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { generateInvitationPDF } from '../utils/pdfGenerator'
import CertificateRequest from './CertificateRequest'

const BUCKET = 'doctor-documents'

// Compress image before upload (photos only, not PDFs)
const compressImage = (file, maxWidth = 1500, quality = 0.7) =>
  new Promise((resolve) => {
    // Skip compression for PDFs
    if (file.type === 'application/pdf') { resolve(file); return }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            // Only use compressed if smaller
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

const docTypes = [
  { key: 'passport', label: 'Passport Copy', icon: '🛂' },
  { key: 'syndicate', label: 'Syndicate / Union Card', icon: '🏥' },
  { key: 'certificate', label: 'Medical Certificate', icon: '🎓' },
  { key: 'cv', label: 'CV / Resume', icon: '📄' },
]

export default function DoctorDashboard({ doctor }) {
  const [documents, setDocuments] = useState([])
  const [conferences, setConferences] = useState([])
  const [invitations, setInvitations] = useState([])
  const [uploading, setUploading] = useState(null) // which docType is uploading
  const [uploadError, setUploadError] = useState('')
  const [activities, setActivities] = useState([])
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [newActivity, setNewActivity] = useState({ title: '', description: '' })
  const [activityImg, setActivityImg] = useState(null)
  const [postingActivity, setPostingActivity] = useState(false)

  useEffect(() => {
    if (!doctor?.id) return
    fetchDocuments()
    fetchConferences()
    fetchInvitations()
    fetchActivities()
  }, [doctor?.id])

  const fetchDocuments = async () => {
    const { data } = await supabase.from('documents').select('*').eq('doctor_id', doctor.id)
    setDocuments(data || [])
  }

  const fetchConferences = async () => {
    const { data } = await supabase.from('conferences').select('*')
    setConferences(data || [])
  }

  const fetchInvitations = async () => {
    const { data } = await supabase.from('invitations').select('*').eq('doctor_id', doctor.id)
    setInvitations(data || [])
  }

  const fetchActivities = async () => {
    const { data } = await supabase.from('member_activities').select('*')
      .eq('doctor_id', doctor.id).order('created_at', { ascending: false })
    setActivities(data || [])
  }

  // ─── File Upload ──────────────────────────────────────────────────────────
  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0]
    if (!file || !doctor?.id) return

    // Max 15MB before compression
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 15MB.')
      return
    }

    setUploadError('')
    setUploading(docType)

    // Compress image (PDFs are skipped automatically)
    const compressed = await compressImage(file)
    const savedKB = Math.round((file.size - compressed.size) / 1024)
    const finalSizeKB = Math.round(compressed.size / 1024)

    const ext = compressed.name.split('.').pop()
    const filePath = `${doctor.id}/${docType}.${ext}`

    const { error: storageErr } = await supabase.storage
      .from(BUCKET).upload(filePath, compressed, { upsert: true })

    if (storageErr) {
      setUploadError(storageErr.message)
      setUploading(null)
      return
    }

    // Upsert document record
    const existing = documents.find(d => d.document_type === docType)
    if (existing) {
      await supabase.from('documents').update({ file_url: filePath }).eq('id', existing.id)
    } else {
      await supabase.from('documents').insert([{ doctor_id: doctor.id, document_type: docType, file_url: filePath }])
    }

    await fetchDocuments()
    setUploading(null)

    if (savedKB > 50) {
      setUploadError(`✅ Uploaded successfully. File compressed from ${Math.round(file.size/1024)}KB to ${finalSizeKB}KB.`)
      setTimeout(() => setUploadError(''), 4000)
    }
  }

  const getDocUrl = (filePath) =>
    supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl

  // ─── Download invitation ──────────────────────────────────────────────────
  const downloadInvitation = async (invitation) => {
    const conference = conferences.find(c => c.id === invitation.conference_id)
    const pdf = await generateInvitationPDF(doctor, conference, invitation)
    pdf.save(`invitation-${invitation.invitation_number}.pdf`)
  }

  // ─── Member Activity ──────────────────────────────────────────────────────
  const postActivity = async (e) => {
    e.preventDefault()
    setPostingActivity(true)
    let image_url = null

    if (activityImg) {
      const ext = activityImg.name.split('.').pop()
      const path = `activities/${doctor.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, activityImg, { upsert: true })
      if (!error) image_url = getDocUrl(path)
    }

    await supabase.from('member_activities').insert([{
      doctor_id: doctor.id,
      doctor_name: doctor.full_name,
      title: newActivity.title,
      description: newActivity.description,
      image_url
    }])

    setNewActivity({ title: '', description: '' })
    setActivityImg(null)
    setShowActivityForm(false)
    setPostingActivity(false)
    fetchActivities()
  }

  const p = doctor || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Profile Card ── */}
      <div className="panel">
        <h2 style={{ fontFamily: 'Cairo', color: 'var(--navy)', marginBottom: '1.2rem', fontSize: '1.4rem' }}>
          My Profile
        </h2>
        <div className="profile-grid">
          {[
            ['Full Name', p.full_name],
            ['Specialty', p.specialty],
            ['Hospital', p.hospital],
            ['Passport No.', p.passport_number],
            ['Syndicate ID', p.syndicate_id],
            ['Nationality', p.nationality],
            ['City', p.city],
            ['Governorate', p.governorate],
            ['Date of Birth', p.date_of_birth],
            ['Syndicate Join Date', p.syndicate_join_date],
            ['Phone', p.phone],
            ['Address', p.address],
          ].map(([label, value]) => value ? (
            <div key={label} className="profile-field">
              <span className="profile-label">{label}</span>
              <span className="profile-value">{value}</span>
            </div>
          ) : null)}
        </div>
      </div>

      {/* ── Documents Upload ── */}
      <div className="panel">
        <h2 style={{ fontFamily: 'Cairo', color: 'var(--navy)', marginBottom: '1rem', fontSize: '1.4rem' }}>
          My Documents
        </h2>
        <p className="muted" style={{ marginBottom: '1.2rem', fontSize: '.9rem' }}>
          Upload your documents. Max 5MB per file. Accepted: PDF, JPG, PNG.
        </p>

        {uploadError && (
          <div className={uploadError.startsWith('✅') ? 'auth-ok' : 'auth-error'} style={{ marginBottom: '1rem' }}>
            {uploadError}
          </div>
        )}

        <div className="doc-grid">
          {docTypes.map(({ key, label, icon }) => {
            const uploaded = documents.find(d => d.document_type === key)
            const isUploading = uploading === key
            return (
              <div key={key} className={`doc-card ${uploaded ? 'doc-card--done' : ''}`}>
                <div className="doc-icon">{icon}</div>
                <div className="doc-info">
                  <span className="doc-label">{label}</span>
                  {uploaded
                    ? <a href={getDocUrl(uploaded.file_url)} target="_blank" rel="noopener noreferrer" className="doc-view">View ↗</a>
                    : <span className="doc-missing">Not uploaded</span>
                  }
                </div>
                <label className="doc-upload-btn">
                  {isUploading ? '⏳' : uploaded ? '🔄 Replace' : '⬆ Upload'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => handleFileUpload(e, key)}
                    disabled={!!uploading} style={{ display: 'none' }} />
                </label>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Invitations ── */}
      <div className="panel">
        <h2 style={{ fontFamily: 'Cairo', color: 'var(--navy)', marginBottom: '1rem', fontSize: '1.4rem' }}>
          My Invitations
        </h2>
        {invitations.length === 0
          ? <p className="muted">No invitations issued yet.</p>
          : invitations.map(inv => {
              const conf = conferences.find(c => c.id === inv.conference_id)
              return (
                <div key={inv.id} className="inv-row">
                  <div>
                    <strong>{conf?.title || 'Conference'}</strong>
                    <p className="muted" style={{ fontSize: '.88rem' }}>No. {inv.invitation_number} · {inv.issue_date}</p>
                  </div>
                  {inv.status === 'issued' && (
                    <button className="btn-primary" style={{ padding: '.5rem 1rem', fontSize: '.9rem' }}
                      onClick={() => downloadInvitation(inv)}>
                      ⬇ Download PDF
                    </button>
                  )}
                </div>
              )
            })
        }
      </div>

      {/* ── Member Activities ── */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Cairo', color: 'var(--navy)', fontSize: '1.4rem' }}>
            My Activities
          </h2>
          <button className="btn-primary" style={{ padding: '.5rem 1rem', fontSize: '.9rem' }}
            onClick={() => setShowActivityForm(!showActivityForm)}>
            {showActivityForm ? 'Cancel' : '+ Share Activity'}
          </button>
        </div>

        {showActivityForm && (
          <form onSubmit={postActivity} className="activity-form">
            <input className="auth-input" placeholder="Activity title *"
              value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} required />
            <textarea className="auth-input" rows="4" placeholder="Description"
              value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} />
            <div className="activity-img-row">
              <label className="doc-upload-btn">
                📷 Add Photo
                <input type="file" accept=".jpg,.jpeg,.png" onChange={e => setActivityImg(e.target.files[0])} style={{ display: 'none' }} />
              </label>
              {activityImg && <span className="muted">{activityImg.name}</span>}
            </div>
            <button className="btn-primary full" type="submit" disabled={postingActivity}>
              {postingActivity ? 'Posting...' : 'Post Activity'}
            </button>
          </form>
        )}

        {activities.length === 0 && !showActivityForm && (
          <p className="muted">No activities posted yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem', marginTop: '1rem' }}>
          {activities.map(a => (
            <div key={a.id} className="news-card-home">
              {a.image_url && <img src={a.image_url} alt={a.title} className="news-img" />}
              <div className="news-body">
                <h3>{a.title}</h3>
                <p className="muted" style={{ fontSize: '.9rem' }}>{a.description}</p>
                <p className="muted" style={{ fontSize: '.8rem' }}>{(a.created_at || '').split('T')[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CertificateRequest doctor={doctor} />
    </div>
  )
}
