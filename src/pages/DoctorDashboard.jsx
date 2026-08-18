import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { generateInvitationPDF } from '../utils/pdfGenerator'
import CertificateRequest from './CertificateRequest'
import { generateCertificatePDF } from '../utils/certificateGenerator'
import { isPlaceholderName } from '../utils/displayName.js'
import { COUNTRIES } from '../countries'

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
  // Invitation requests
  const [invRequests, setInvRequests] = useState([])
  const [selectedConfId, setSelectedConfId] = useState('')
  const [invReqMsg, setInvReqMsg] = useState('')
  const [submittingReq, setSubmittingReq] = useState(false)
  const [reqSent, setReqSent] = useState(false)
  const [certRecord, setCertRecord] = useState(null)

  const fetchCertRecord = async () => {
    if (!doctor?.id) return
    const { data } = await supabase.from('certificate_requests')
      .select('*').eq('doctor_id', doctor.id).eq('status', 'approved')
      .order('created_at', { ascending: false }).limit(1)
    if (data && data.length > 0) setCertRecord(data[0])
  }

  const fetchDocuments = async () => {
    if (!doctor?.id) return
    const { data } = await supabase.from('documents').select('*').eq('doctor_id', doctor.id)
    setDocuments(data || [])
  }

  const fetchConferences = async () => {
    const { data } = await supabase.from('conferences').select('*')
    setConferences(data || [])
  }

  const fetchInvitations = async () => {
    if (!doctor?.id) return
    const { data } = await supabase.from('invitations').select('*').eq('doctor_id', doctor.id)
    setInvitations(data || [])
  }

  useEffect(() => {
    // Conferences don't need doctor.id - fetch always
    fetchConferences()
  }, [])

  useEffect(() => {
    if (!doctor?.id) return
    fetchDocuments()
    fetchInvitations()
    fetchActivities()
    fetchInvRequests()
    fetchCertRecord()
  }, [doctor?.id])

  const downloadCertificate = async () => {
    if (!certRecord) return
    const certNumber = certRecord.cert_number || `FGR-CERT-${doctor.id?.slice(0,4).toUpperCase()}-${new Date().getFullYear()}`
    const pdf = await generateCertificatePDF(doctor, certNumber, certRecord.issued_date)
    pdf.save(`FGR-Certificate-${doctor.full_name}.pdf`)
  }

  const fetchInvRequests = async () => {
    const { data } = await supabase.from('invitation_requests')
      .select('*, conferences(title)')
      .eq('email', doctor.email)
      .order('created_at', { ascending: false })
    setInvRequests(data || [])
  }

  const submitInvitationRequest = async (e) => {
    e.preventDefault()
    if (!selectedConfId) { alert('Please select a conference'); return }
    if (!doctor?.id || !doctor?.email) {
      alert('Your profile data is not fully loaded. Please refresh the page and try again.')
      return
    }
    setSubmittingReq(true)
    try {
      // Check for duplicate
      const { data: existing } = await supabase.from('invitation_requests')
        .select('id').eq('email', doctor.email).eq('conference_id', selectedConfId).eq('status', 'new')
      if (existing && existing.length > 0) {
        alert('You already have a pending request for this conference.')
        setSubmittingReq(false); return
      }
      const { error } = await supabase.from('invitation_requests').insert([{
        full_name: (doctor.full_name || '').trim(),
        email: doctor.email,
        specialty: doctor.specialty || '',
        passport_number: doctor.passport_number || '',
        conference_id: selectedConfId,
        message: invReqMsg,
        status: 'new'
      }])
      if (error) {
        alert('Error submitting request: ' + error.message)
      } else {
        setReqSent(true)
        setSelectedConfId('')
        setInvReqMsg('')
        fetchInvRequests()
        setTimeout(() => setReqSent(false), 4000)
      }
    } catch (err) {
      alert('Unexpected error: ' + err.message)
    } finally {
      setSubmittingReq(false)
    }
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
    // The storage policy scopes a member to a folder named after their auth
    // user id, not their doctors row id — using the row id is denied.
    const { data: authData } = await supabase.auth.getUser()
    const uid = authData?.user?.id
    if (!uid) { setUploadError('Session expired — please sign in again.'); setUploading(null); return }
    const filePath = `${uid}/${docType}.${ext}`

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

  // The bucket is private, so a public URL returns an error — a short-lived
  // signed URL is the only way to display a stored document.
  const openDoc = async (filePath) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600)
    if (error || !data?.signedUrl) { setUploadError('Could not open file: ' + (error?.message || 'unknown error')); return }
    window.open(data.signedUrl, '_blank')
  }

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
      const { data: authData } = await supabase.auth.getUser()
      const uid = authData?.user?.id
      // Same folder rule as documents: the first segment must be the auth uid.
      const path = `${uid}/activities/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, activityImg, { upsert: true })
      if (!error) image_url = path   // stored as a path; signed on demand when displayed
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

  // ── Profile completion ────────────────────────────────────────────────────
  // Accounts created before the profile write was fixed have a name taken from
  // the email prefix and empty professional fields. The member fills them here;
  // row-level security limits the update to their own row and the database
  // guard prevents any change to status / visible / is_admin.
  const missing = !p.specialty || !p.hospital || !p.passport_number ||
                  !p.nationality || !p.city || isPlaceholderName(p)
  const [showComplete, setShowComplete] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [cf, setCf] = useState({
    full_name: isPlaceholderName(p) ? '' : (p.full_name || ''),
    specialty: p.specialty || '', hospital: p.hospital || '',
    affiliation: p.affiliation || '', phone: p.phone || '',
    passport_number: p.passport_number || '', syndicate_id: p.syndicate_id || '',
    nationality: p.nationality || '', city: p.city || '',
    governorate: p.governorate || '', date_of_birth: p.date_of_birth || '',
    syndicate_join_date: p.syndicate_join_date || '', address: p.address || ''
  })

  const saveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg('')
    const required = [['full_name', 'Full name'], ['specialty', 'Specialty'],
                      ['hospital', 'Workplace'], ['passport_number', 'Passport number'],
                      ['nationality', 'Nationality'], ['city', 'City']]
    for (const [key, label] of required) {
      if (!String(cf[key] || '').trim()) { setProfileMsg(`⚠️ ${label} is required`); return }
    }
    setSavingProfile(true)
    const payload = Object.fromEntries(
      Object.entries(cf).map(([k, v]) => [k, String(v).trim() === '' ? null : v])
    )
    payload.full_name = String(cf.full_name).trim()
    const { data, error } = await supabase
      .from('doctors').update(payload).eq('id', p.id).select('id')
    setSavingProfile(false)
    if (error) { setProfileMsg('❌ Save failed: ' + error.message); return }
    if (!data || data.length === 0) { setProfileMsg('❌ Save failed: profile row not found.'); return }
    setProfileMsg('✅ Saved. The administration will review your membership.')
    setTimeout(() => window.location.reload(), 1500)
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Complete your profile ── */}
      {missing && (
        <div className="panel" style={{ borderTop: '4px solid #d97706' }}>
          <h2 style={{ fontFamily: 'Cairo', color: '#b45309', marginBottom: '.6rem', fontSize: '1.3rem' }}>
            ⚠️ أكمل ملفك الشخصي — Complete Your Profile
          </h2>
          <p className="muted" style={{ fontSize: '.9rem', marginBottom: '1rem' }}>
            بياناتك المهنية غير مسجّلة في النظام. أكملها هنا ليتمكن مجلس الجمعية من مراجعة عضويتك.
            <br />
            Your professional details are not on record. Please complete them so the association can review your membership.
          </p>

          {!showComplete ? (
            <button className="btn-primary" onClick={() => setShowComplete(true)}>
              ✏️ إكمال البيانات / Complete now
            </button>
          ) : (
            <div>
              <div className="profile-grid">
                {[
                  ['full_name', 'Full name (as in passport) *', 'text'],
                  ['specialty', 'Specialty *', 'text'],
                  ['hospital', 'Workplace / Hospital *', 'text'],
                  ['passport_number', 'Passport number *', 'text'],
                  ['city', 'City *', 'text'],
                  ['syndicate_id', 'Syndicate / Work ID', 'text'],
                  ['governorate', 'Governorate', 'text'],
                  ['phone', 'Phone', 'tel'],
                  ['affiliation', 'Affiliation', 'text'],
                  ['address', 'Address', 'text'],
                  ['date_of_birth', 'Date of birth', 'date'],
                  ['syndicate_join_date', 'Syndicate join date', 'date'],
                ].map(([key, label, type]) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                    <label className="profile-label">{label}</label>
                    <input
                      className="auth-input" type={type}
                      value={cf[key] || ''}
                      onChange={e => setCf({ ...cf, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                  <label className="profile-label">Nationality *</label>
                  <select
                    className="auth-input" value={cf.nationality || ''}
                    onChange={e => setCf({ ...cf, nationality: e.target.value })}
                  >
                    <option value="">—</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.en}>{c.flag} {c.en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {profileMsg && (
                <p style={{ marginTop: '1rem', fontSize: '.9rem', fontWeight: 600 }}>{profileMsg}</p>
              )}

              <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? 'جارٍ الحفظ…' : '💾 حفظ / Save'}
                </button>
                <button className="btn-soft" onClick={() => setShowComplete(false)} disabled={savingProfile}>
                  إلغاء / Cancel
                </button>
              </div>
              <p className="muted" style={{ fontSize: '.8rem', marginTop: '.8rem' }}>
                لا يمكنك تغيير حالة العضوية بنفسك — الاعتماد من إدارة الجمعية فقط.
              </p>
            </div>
          )}
        </div>
      )}

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
                    ? <button className="doc-view" onClick={() => openDoc(uploaded.file_url)}>View ↗</button>
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

      {/* ── Membership Certificate ── */}
      {certRecord && (
        <div className="panel" style={{ background: 'linear-gradient(135deg, #0B2E5C 0%, #1A8FA8 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Cairo', fontSize: '1.4rem', marginBottom: '.4rem' }}>
                🎓 Membership Certificate
              </h2>
              <p style={{ opacity: .85, fontSize: '.9rem' }}>
                Issued: {certRecord.issued_date} · No: {certRecord.cert_number || 'FGR-CERT'}
              </p>
            </div>
            <button
              onClick={downloadCertificate}
              style={{ background: '#fff', color: '#0B2E5C', fontWeight: 700, padding: '.7rem 1.5rem', borderRadius: 10, fontSize: '.95rem', cursor: 'pointer', border: 'none' }}>
              ⬇ Download Certificate
            </button>
          </div>
        </div>
      )}

      {/* ── Invitation Request ── */}
      <div className="panel">
        <h2 style={{ fontFamily: 'Cairo', color: 'var(--navy)', marginBottom: '1rem', fontSize: '1.4rem' }}>
          Request an Invitation Letter
        </h2>
        <p className="muted" style={{ marginBottom: '1.2rem', fontSize: '.9rem' }}>
          Select a conference below to request an official invitation letter. The administration will review your request and issue the invitation.
        </p>

        {reqSent && (
          <div className="auth-ok" style={{ marginBottom: '1rem' }}>
            ✓ Your request has been submitted. The admin will review and issue your invitation.
          </div>
        )}

        <form onSubmit={submitInvitationRequest} style={{ display: 'flex', flexDirection: 'column', gap: '.8rem', maxWidth: 500 }}>
          <select className="auth-input" value={selectedConfId} onChange={e => setSelectedConfId(e.target.value)} required>
            <option value="">— Select Conference —</option>
            {conferences.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.start_date})</option>
            ))}
          </select>

          <div style={{ background: '#EBF4F8', border: '1px solid var(--teal)', borderRadius: 8, padding: '.8rem 1rem', fontSize: '.85rem', color: 'var(--navy)' }}>
            💷 <strong>Conference registration fee: £550</strong>, covered by the sponsoring body as financial expenses.
          </div>

          <textarea className="auth-input" rows="3"
            placeholder="Additional notes (optional)"
            value={invReqMsg} onChange={e => setInvReqMsg(e.target.value)} />
          <button className="btn-primary" type="submit" disabled={submittingReq} style={{ width: 'fit-content', padding: '.7rem 1.8rem' }}>
            {submittingReq ? 'Submitting...' : '📨 Submit Invitation Request'}
          </button>
        </form>

        {invRequests.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: 'var(--navy)', marginBottom: '.8rem', fontSize: '1rem' }}>Previous Requests</h3>
            {invRequests.map(r => (
              <div key={r.id} className="inv-row">
                <div>
                  <strong>{r.conferences?.title || 'Conference'}</strong>
                  <p className="muted" style={{ fontSize: '.85rem' }}>
                    {(r.created_at || '').split('T')[0]} ·{' '}
                    <span style={{ color: r.status === 'issued' ? '#27ae60' : r.status === 'rejected' ? '#e74c3c' : '#f39c12', fontWeight: 700 }}>
                      {r.status === 'new' ? '⏳ Pending' : r.status === 'issued' ? '✅ Issued' : '❌ Rejected'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CertificateRequest doctor={doctor} />
    </div>
  )
}
