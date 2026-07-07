import React, { useState, useEffect } from 'react'
import { supabase, generateInvitationNumber } from '../supabaseClient'
import { generateInvitationPDF } from '../utils/pdfGenerator'
import { notifyApproved, notifyRejected, notifyInvitation } from '../utils/notifications.js'
import { generateCertificatePDF } from '../utils/certificateGenerator'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import { useLang } from '../i18n.jsx'

export default function AdminDashboard() {
  const { t } = useLang()
  const [tab, setTab] = useState('overview')
  const [doctors, setDoctors] = useState([])
  const [conferences, setConferences] = useState([])
  const [invitations, setInvitations] = useState([])
  const [reports, setReports] = useState([])
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [invitationRequests, setInvitationRequests] = useState([])
  const [certRequests, setCertRequests] = useState([])
  const [memberActivities, setMemberActivities] = useState([])
  const [editRequests, setEditRequests] = useState([])
  const [editInvitation, setEditInvitation] = useState(null)
  const [editCert, setEditCert] = useState(null)
  const [editConference, setEditConference] = useState(null)

  // doctor search/filter
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('')
  // global search
  const [globalSearch, setGlobalSearch] = useState('')
  const [globalResults, setGlobalResults] = useState(null)

  // modals
  const [viewDoctor, setViewDoctor] = useState(null)
  const [detailsDoctor, setDetailsDoctor] = useState(null)
  const [editDoctor, setEditDoctor] = useState(null)
  const [docFiles, setDocFiles] = useState([])

  // conference form
  const [showConfForm, setShowConfForm] = useState(false)
  const [newConf, setNewConf] = useState({ title: '', location: '', start_date: '', end_date: '', registration_deadline: '', description: '' })

  // invitation builder (editable before issuing)
  const [inv, setInv] = useState({ doctorId: '', conferenceId: '', travelDate: '', issueDate: new Date().toISOString().split('T')[0], number: '' })
  const [invDoctorEdit, setInvDoctorEdit] = useState(null)

  useEffect(() => { refreshAll() }, [])

  const refreshAll = () => { fetchDoctors(); fetchConferences(); fetchInvitations(); fetchReports(); fetchPending(); fetchInvitationRequests(); fetchCertRequests(); fetchMemberActivities(); fetchEditRequests() }
  const fetchDoctors = async () => { const { data } = await supabase.from('doctors').select('*').order('created_at', { ascending: false }); setDoctors(data || []) }
  const fetchConferences = async () => { const { data } = await supabase.from('conferences').select('*'); setConferences(data || []) }
  const fetchInvitations = async () => { const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false }); setInvitations(data || []) }
  const fetchReports = async () => { const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }); setReports(data || []) }
  const fetchPending = async () => { const { data } = await supabase.from('doctors').select('*').eq('status', 'pending'); setPendingDoctors(data || []) }
  const fetchInvitationRequests = async () => { const { data } = await supabase.from('invitation_requests').select('*').order('created_at', { ascending: false }); setInvitationRequests(data || []) }
  const fetchCertRequests = async () => { const { data } = await supabase.from('certificate_requests').select('*, doctors(full_name, email)').order('created_at', { ascending: false }); setCertRequests(data || []) }
  const fetchMemberActivities = async () => { const { data } = await supabase.from('member_activities').select('*').order('created_at', { ascending: false }); setMemberActivities(data || []) }
  const fetchEditRequests = async () => { const { data } = await supabase.from('profile_edit_requests').select('*, doctors(full_name, email)').order('created_at', { ascending: false }); setEditRequests(data || []) }

  // ---------- filters ----------
  const doGlobalSearch = (q) => {
    setGlobalSearch(q)
    if (!q.trim()) { setGlobalResults(null); return }
    const s = q.toLowerCase().trim()
    const matchDoctors = doctors.filter(d =>
      (d.full_name || '').toLowerCase().includes(s) ||
      (d.email || '').toLowerCase().includes(s) ||
      (d.passport_number || '').toLowerCase().includes(s) ||
      (d.specialty || '').toLowerCase().includes(s)
    )
    const matchInvitations = invitations.filter(inv =>
      (inv.invitation_number || '').toLowerCase().includes(s) ||
      (doctors.find(d => d.id === inv.doctor_id)?.full_name || '').toLowerCase().includes(s) ||
      (conferences.find(c => c.id === inv.conference_id)?.title || '').toLowerCase().includes(s)
    )
    const matchConferences = conferences.filter(c =>
      (c.title || '').toLowerCase().includes(s) ||
      (c.location || '').toLowerCase().includes(s)
    )
    setGlobalResults({ doctors: matchDoctors, invitations: matchInvitations, conferences: matchConferences })
  }
  const countries = [...new Set(doctors.map(d => d.nationality).filter(Boolean))]
  const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))]
  const filteredDoctors = doctors.filter(d => {
    const s = search.trim().toLowerCase()
    const matchSearch = !s || (d.full_name || '').toLowerCase().includes(s) || (d.email || '').toLowerCase().includes(s) || (d.passport_number || '').toLowerCase().includes(s)
    const matchCountry = !filterCountry || d.nationality === filterCountry
    const matchSpec = !filterSpecialty || d.specialty === filterSpecialty
    return matchSearch && matchCountry && matchSpec
  })

  // ---------- documents ----------
  const openDoctorFiles = async (doctor) => {
    setViewDoctor(doctor)
    setDocFiles([])
    const { data, error } = await supabase.from('documents').select('*').eq('doctor_id', doctor.id)
    if (error) { alert('Error loading documents: ' + error.message); return }
    if (!data || data.length === 0) {
      setDocFiles([])
      return
    }
    const withUrls = data.map(doc => {
      // Use signed URL as fallback if public URL fails
      const publicUrl = supabase.storage.from('doctor-documents').getPublicUrl(doc.file_url).data.publicUrl
      return { ...doc, url: publicUrl }
    })
    setDocFiles(withUrls)
  }

  const openSignedFile = async (filePath) => {
    // Try exact path first
    const { data, error } = await supabase.storage
      .from('doctor-documents')
      .createSignedUrl(filePath, 3600)
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
      return
    }
    // Fallback: list the doctor's folder and find the matching document type
    const folder = filePath.split('/')[0]
    const docType = filePath.split('/')[1]?.split('.')[0] // 'passport' or 'syndicate'
    const { data: list } = await supabase.storage.from('doctor-documents').list(folder)
    if (list && list.length > 0) {
      const match = list.find(f => f.name.startsWith(docType))
      if (match) {
        const { data: signed } = await supabase.storage
          .from('doctor-documents')
          .createSignedUrl(`${folder}/${match.name}`, 3600)
        if (signed?.signedUrl) { window.open(signed.signedUrl, '_blank'); return }
      }
    }
    alert('File not found in storage. This member may need to re-upload their documents.\n\nPath: ' + filePath)
  }

  // ---------- conference ----------
  const createConference = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('conferences').insert([newConf])
    if (!error) { setNewConf({ title: '', location: '', start_date: '', end_date: '', registration_deadline: '', description: '' }); setShowConfForm(false); fetchConferences() }
    else alert(error.message)
  }
  const deleteConference = async (id) => {
    if (!confirm('حذف هذا المؤتمر؟')) return
    const { error } = await supabase.from('conferences').delete().eq('id', id)
    if (error) {
      alert('لا يمكن حذف المؤتمر لوجود دعوات مرتبطة به. احذف الدعوات أولاً.\n\n' + error.message)
    } else {
      fetchConferences()
    }
  }

  // ---------- doctor edit/delete ----------
  const saveDoctor = async (e) => {
    e.preventDefault()
    const { id, full_name, specialty, hospital, affiliation, phone, nationality, passport_number, years_of_experience, email, syndicate_id, city, governorate } = editDoctor
    const { error } = await supabase.from('doctors').update({
      full_name, specialty, hospital, affiliation, phone, nationality, passport_number,
      syndicate_id, city, governorate,
      years_of_experience: years_of_experience ? parseInt(years_of_experience) : null, email
    }).eq('id', id)
    if (!error) { setEditDoctor(null); fetchDoctors() } else alert(error.message)
  }
  const deleteDoctor = async (id) => {
    if (!confirm('حذف هذا الطبيب نهائياً؟ سيتم حذف دعواته ووثائقه أيضاً.')) return
    // 1) Delete storage files (get paths from documents table)
    try {
      const { data: docs } = await supabase.from('documents').select('file_url').eq('doctor_id', id)
      if (docs && docs.length > 0) {
        const paths = docs.map(d => d.file_url).filter(Boolean)
        if (paths.length > 0) await supabase.storage.from('doctor-documents').remove(paths)
      }
    } catch (e) { /* ignore storage errors */ }
    // 2) Delete related records
    await supabase.from('documents').delete().eq('doctor_id', id)
    await supabase.from('invitations').delete().eq('doctor_id', id)
    await supabase.from('certificate_requests').delete().eq('doctor_id', id)
    await supabase.from('member_activities').delete().eq('doctor_id', id)
    // 3) Delete the doctor record
    await supabase.from('doctors').delete().eq('id', id)
    fetchDoctors(); fetchInvitations(); fetchCertRequests()
    alert('تم حذف الطبيب ووثائقه.\n\nملاحظة: حساب الدخول (الإيميل) يبقى في النظام. لإعادة استخدام نفس الإيميل، احذفه يدوياً من Supabase → Authentication → Users.')
  }

  // ---------- export ----------
  const exportExcel = () => {
    const rows = filteredDoctors.map(d => ({
      'Name': d.full_name, 'Email': d.email, 'Phone': d.phone,
      'Date of Birth': d.date_of_birth, 'Profession': d.profession,
      'Specialty': d.specialty, 'Workplace': d.hospital, 'Affiliation': d.affiliation,
      'Passport': d.passport_number, 'Work ID/Syndicate': d.syndicate_id,
      'Nationality': d.nationality, 'City': d.city, 'Governorate': d.governorate,
      'Status': d.status
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors')
    XLSX.writeFile(wb, 'doctors.xlsx')
  }
  const exportPDF = () => {
    const pdf = new jsPDF()
    pdf.setFontSize(16); pdf.text('Global Fertility Research - Doctors', 14, 18)
    pdf.setFontSize(9)
    let y = 30
    pdf.text('Name', 14, y); pdf.text('Specialty', 70, y); pdf.text('Country', 120, y); pdf.text('Passport', 160, y)
    y += 6
    filteredDoctors.forEach(d => {
      if (y > 280) { pdf.addPage(); y = 20 }
      pdf.text(String(d.full_name || '').slice(0, 30), 14, y)
      pdf.text(String(d.specialty || '').slice(0, 25), 70, y)
      pdf.text(String(d.nationality || ''), 120, y)
      pdf.text(String(d.passport_number || ''), 160, y)
      y += 6
    })
    pdf.save('doctors.pdf')
  }

  // ---------- instant issue (no review step) ----------
  const instantIssue = async () => {
    if (!inv.doctorId) { alert('Please select a doctor first'); return }
    if (!inv.conferenceId) { alert('Please select a conference first'); return }

    const doctor = doctors.find(d => d.id === inv.doctorId)
    const conference = conferences.find(c => c.id === inv.conferenceId)
    if (!doctor) { alert('Doctor not found'); return }
    if (!conference) { alert('Conference not found'); return }

    // Prevent duplicate invitation for the same doctor + same conference
    const { data: dup } = await supabase.from('invitations')
      .select('id').eq('doctor_id', inv.doctorId).eq('conference_id', inv.conferenceId)
    if (dup && dup.length > 0) {
      alert('⚠️ This doctor already has an invitation for this conference. Only one invitation per conference is allowed.')
      return
    }

    let invNumber = inv.number || generateInvitationNumber()
    const issueDate = inv.issueDate || new Date().toISOString().split('T')[0]

    // Retry up to 3 times if duplicate key
    let data, error
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase.from('invitations').insert([{
        doctor_id: inv.doctorId,
        conference_id: inv.conferenceId,
        invitation_number: invNumber,
        issue_date: issueDate,
        travel_date: inv.travelDate || null,
        status: 'issued'
      }]).select()
      data = result.data
      error = result.error
      if (!error) break
      if (error.code === '23505') {
        // Duplicate - regenerate number and retry
        invNumber = generateInvitationNumber()
        await new Promise(r => setTimeout(r, 50))
      } else break
    }

    if (error) { alert('Error: ' + error.message); return }

    try {
      const pdf = await generateInvitationPDF(doctor, conference, data[0])
      pdf.save(`${invNumber}.pdf`)
    } catch (err) {
      alert('PDF error: ' + err.message)
      return
    }

    setInv({ doctorId: '', conferenceId: '', travelDate: '', issueDate: new Date().toISOString().split('T')[0], number: '' })
    setInvDoctorEdit(null)
    fetchInvitations()
    // Send invitation email (non-blocking)
    if (doctor?.email) notifyInvitation(doctor.email, (doctor.full_name || '').trim(), conference.title, invNumber)
    alert('✅ Invitation issued and PDF downloaded!')
  }

  // ---------- admin assignment ----------
  const toggleAdmin = async (doctor) => {
    const newVal = !doctor.is_admin
    await supabase.from('doctors').update({ is_admin: newVal }).eq('id', doctor.id)
    fetchDoctors()
  }

  const [adminEmailInput, setAdminEmailInput] = useState('')
  const [adminMsg, setAdminMsg] = useState('')
  const [certDoctorId, setCertDoctorId] = useState('')
  const [certMsg, setCertMsg] = useState('')

  const issueCertManual = async () => {
    if (!certDoctorId) { setCertMsg('Please select a member'); return }
    const doctor = doctors.find(d => d.id === certDoctorId)
    if (!doctor) { setCertMsg('Member not found'); return }
    if (doctor.status !== 'approved') { setCertMsg('⚠️ This member must be approved first'); return }
    // Check for existing certificate
    let cert = certRequests.find(r => r.doctor_id === certDoctorId && r.status === 'approved')
    if (!cert) {
      const issueDate = new Date().toISOString().split('T')[0]
      const certNumber = `FGR-CERT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`
      const { data: newCert, error } = await supabase.from('certificate_requests').insert([{
        doctor_id: certDoctorId, status: 'approved', issued_date: issueDate, cert_number: certNumber
      }]).select().single()
      if (error) { setCertMsg('Error: ' + error.message); return }
      cert = newCert
      fetchCertRequests()
      setCertMsg(`✅ New certificate issued: ${certNumber}`)
    } else {
      setCertMsg(`ℹ️ Existing certificate: ${cert.cert_number} — downloading`)
    }
    const { generateCertificatePDF } = await import('../utils/certificateGenerator.js')
    const pdf = await generateCertificatePDF(doctor, cert.cert_number || 'FGR-CERT', cert.issued_date)
    pdf.save(`Certificate-${(doctor.full_name||'').trim()}.pdf`)
  }
  const grantAdminByEmail = async () => {
    const email = adminEmailInput.trim().toLowerCase()
    if (!email) { setAdminMsg('Please enter an email'); return }
    const { data, error } = await supabase.from('doctors').select('id, full_name, is_admin').eq('email', email).single()
    if (error || !data) { setAdminMsg('❌ No member found with this email'); return }
    if (data.is_admin) { setAdminMsg('ℹ️ This member is already an admin'); return }
    await supabase.from('doctors').update({ is_admin: true }).eq('id', data.id)
    setAdminMsg(`✅ ${data.full_name} is now an admin`)
    setAdminEmailInput('')
    fetchDoctors()
  }
  const revokeAdmin = async (id, name) => {
    if (!confirm(`Remove admin rights from ${name}?`)) return
    await supabase.from('doctors').update({ is_admin: false }).eq('id', id)
    fetchDoctors()
  }

  // ---------- issue invitation (review) ----------
  const selectedInvDoctor = doctors.find(d => d.id === inv.doctorId)
  const startInvitation = () => {
    if (!inv.doctorId || !inv.conferenceId || !inv.travelDate) { alert('اختر الطبيب والمؤتمر وتاريخ السفر'); return }
    setInv(p => ({ ...p, number: p.number || generateInvitationNumber() }))
    setInvDoctorEdit({ ...selectedInvDoctor })
  }
  const confirmIssue = async () => {
    const conference = conferences.find(c => c.id === inv.conferenceId)
    const { data, error } = await supabase.from('invitations').insert([{
      doctor_id: inv.doctorId, conference_id: inv.conferenceId,
      invitation_number: inv.number, issue_date: inv.issueDate,
      travel_date: inv.travelDate, status: 'issued'
    }]).select()
    if (error) { alert(error.message); return }
    // use edited doctor details for the PDF (without changing DB)
    const pdf = await generateInvitationPDF(invDoctorEdit, conference, data[0])
    pdf.save(`${inv.number}.pdf`)
    setInv({ doctorId: '', conferenceId: '', travelDate: '', issueDate: new Date().toISOString().split('T')[0], number: '' })
    setInvDoctorEdit(null)
    fetchInvitations()
    alert('تم إصدار الدعوة وتنزيل ملف PDF')
  }
  const reprint = async (invitation) => {
    const doctor = doctors.find(d => d.id === invitation.doctor_id)
    const conference = conferences.find(c => c.id === invitation.conference_id)
    if (!doctor) { alert('Doctor data not found'); return }
    if (!conference) { alert('Conference data not found'); return }
    // Trim any trailing spaces from doctor name
    const cleanDoctor = { ...doctor, full_name: (doctor.full_name || '').trim() }
    try {
      const pdf = await generateInvitationPDF(cleanDoctor, conference, invitation)
      pdf.save(`${invitation.invitation_number}.pdf`)
    } catch (err) {
      alert('PDF generation error: ' + err.message)
    }
  }
  const deleteInvitation = async (id) => { if (confirm('حذف هذه الدعوة؟')) { await supabase.from('invitations').delete().eq('id', id); fetchInvitations() } }
  const deleteReport = async (id) => { if (confirm('حذف هذا البلاغ؟')) { await supabase.from('reports').delete().eq('id', id); fetchReports() } }
  const toggleVisible = async (doctor) => {
    const newVal = !doctor.visible
    await supabase.from('doctors').update({ visible: newVal }).eq('id', doctor.id)
    fetchDoctors()
  }

  const approveDoctor = async (id) => {
    const doctor = pendingDoctors.find(d => d.id === id) || doctors.find(d => d.id === id)
    await supabase.from('doctors').update({ status: 'approved' }).eq('id', id)
    // Check if certificate already exists — one certificate per member
    const { data: existing } = await supabase.from('certificate_requests')
      .select('id').eq('doctor_id', id).eq('status', 'approved')
    if (!existing || existing.length === 0) {
      const issueDate = new Date().toISOString().split('T')[0]
      const certNumber = `FGR-CERT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`
      await supabase.from('certificate_requests').insert([{
        doctor_id: id,
        status: 'approved',
        issued_date: issueDate,
        cert_number: certNumber
      }])
    }
    // Send approval email (non-blocking)
    if (doctor?.email) notifyApproved(doctor.email, (doctor.full_name || '').trim())
    fetchPending()
    fetchDoctors()
    fetchCertRequests()
  }
  const rejectDoctor = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):')
    if (reason === null) return // cancelled
    const doctor = pendingDoctors.find(d => d.id === id) || doctors.find(d => d.id === id)
    await supabase.from('doctors').update({ status: 'rejected', rejection_reason: reason || '' }).eq('id', id)
    // Send rejection email (non-blocking)
    if (doctor?.email) notifyRejected(doctor.email, (doctor.full_name || '').trim(), reason || '')
    fetchPending()
  }
  const approveCert = async (id) => { await supabase.from('certificate_requests').update({ status: 'approved', issued_date: new Date().toISOString().split('T')[0] }).eq('id', id); fetchCertRequests() }
  const deleteActivity = async (id) => { if (confirm('Delete this activity?')) { await supabase.from('member_activities').delete().eq('id', id); fetchMemberActivities() } }
  const applyEditRequest = async (req) => {
    await supabase.from('doctors').update(req.requested_changes).eq('id', req.doctor_id)
    await supabase.from('profile_edit_requests').update({ status: 'approved' }).eq('id', req.id)
    fetchEditRequests(); fetchDoctors()
  }
  const saveEditInvitation = async () => {
    if (!editInvitation) return
    const { id, doctor_id, conference_id, invitation_number, issue_date, travel_date, corrected_name } = editInvitation
    await supabase.from('invitations').update({ doctor_id, conference_id, invitation_number, issue_date, travel_date }).eq('id', id)
    // If a corrected name was provided, update the doctor's profile so passport, profile and invitation all match
    if (corrected_name && corrected_name.trim()) {
      await supabase.from('doctors').update({ full_name: corrected_name.trim() }).eq('id', doctor_id)
      fetchDoctors()
    }
    setEditInvitation(null)
    fetchInvitations()
  }

  const saveEditCert = async () => {
    if (!editCert) return
    const { id, issued_date, cert_number } = editCert
    // Also update doctor specialty if changed
    await supabase.from('certificate_requests').update({ issued_date, cert_number }).eq('id', id)
    setEditCert(null)
    fetchCertRequests()
  }

  const saveEditConference = async () => {
    if (!editConference) return
    const { id, title, location, start_date, end_date, description, event_type, registration_deadline } = editConference
    await supabase.from('conferences').update({ title, location, start_date, end_date, description, event_type, registration_deadline }).eq('id', id)
    setEditConference(null)
    fetchConferences()
  }

  const deleteInvitationRequest = async (id) => {
    if (confirm('Delete this invitation request?')) {
      await supabase.from('invitation_requests').delete().eq('id', id)
      fetchInvitationRequests()
    }
  }

  const rejectEditRequest = async (id) => {
    await supabase.from('profile_edit_requests').update({ status: 'rejected' }).eq('id', id)
    fetchEditRequests()
  }

  // Issue invitation directly from a request
  const issueFromRequest = async (request) => {
    const doctor = doctors.find(d => d.email === request.email)
    if (!doctor) { alert('Doctor not found in system. They must complete full registration first.'); return }
    const conference = conferences.find(c => c.id === request.conference_id)
    if (!conference) { alert('Conference not found.'); return }

    const invNumber = generateInvitationNumber()
    const issueDate = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.from('invitations').insert([{
      doctor_id: doctor.id,
      conference_id: request.conference_id,
      invitation_number: invNumber,
      issue_date: issueDate,
      travel_date: null,
      status: 'issued'
    }]).select()

    if (error) { alert(error.message); return }

    // Update request status
    await supabase.from('invitation_requests').update({ status: 'issued' }).eq('id', request.id)

    // Generate and download PDF
    const pdf = await generateInvitationPDF(doctor, conference, data[0])
    pdf.save(`${invNumber}.pdf`)

    fetchInvitationRequests()
    fetchInvitations()
    alert('Invitation issued and PDF downloaded!')
  }

  return (
    <div className="admin">
      <h1>لوحة التحكم</h1>

      {/* tabs */}
      <div className="admin-tabs">
        <button className={tab === 'overview' ? 'atab active' : 'atab'} onClick={() => setTab('overview')}>{t('admin_overview')}</button>
        <button className={tab === 'doctors' ? 'atab active' : 'atab'} onClick={() => setTab('doctors')}>{t('admin_doctors')}</button>
        <button className={tab === 'conferences' ? 'atab active' : 'atab'} onClick={() => setTab('conferences')}>{t('admin_conferences')}</button>
        <button className={tab === 'invite' ? 'atab active' : 'atab'} onClick={() => setTab('invite')}>{t('admin_invite')}</button>
        <button className={tab === 'issue-cert' ? 'atab active' : 'atab'} onClick={() => setTab('issue-cert')}>🎓 Issue Certificate</button>
        <button className={tab === 'invitations' ? 'atab active' : 'atab'} onClick={() => setTab('invitations')}>{t('admin_invitations')}</button>
        <button className={tab === 'reports' ? 'atab active' : 'atab'} onClick={() => setTab('reports')}>{t('admin_reports')}{reports.length ? ` (${reports.length})` : ''}</button>
        <button className={tab === 'pending' ? 'atab active' : 'atab'} onClick={() => setTab('pending')}>{t('admin_pending')}{pendingDoctors.length ? ` (${pendingDoctors.length})` : ''}</button>
        <button className={tab === 'admins' ? 'atab active' : 'atab'} onClick={() => setTab('admins')}>🛡️ Admins</button>
        <button className={tab === 'inv-requests' ? 'atab active' : 'atab'} onClick={() => setTab('inv-requests')}>{t('admin_inv_requests')}{invitationRequests.filter(r => r.status === 'new').length ? ` (${invitationRequests.filter(r => r.status === 'new').length})` : ''}</button>
        <button className={tab === 'inv-archive' ? 'atab active' : 'atab'} onClick={() => setTab('inv-archive')}>📦 Requests Archive</button>
        <button className={tab === 'cert-requests' ? 'atab active' : 'atab'} onClick={() => setTab('cert-requests')}>{t('admin_certificates')}{certRequests.length ? ` (${certRequests.length})` : ''}</button>
        <button className={tab === 'activities' ? 'atab active' : 'atab'} onClick={() => setTab('activities')}>{t('admin_activities')}</button>
      </div>

      <div className="global-search-bar">
        <span className="global-search-icon">🔍</span>
        <input
          className="global-search-input"
          placeholder="Search doctors, invitations, conferences..."
          value={globalSearch}
          onChange={e => doGlobalSearch(e.target.value)}
        />
        {globalSearch && (
          <button className="global-search-clear" onClick={() => { setGlobalSearch(''); setGlobalResults(null) }}>✕</button>
        )}
      </div>

      {/* GLOBAL SEARCH RESULTS */}
      {globalResults && (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            Search results for: <span style={{ color: 'var(--teal)' }}>{globalSearch}</span>
          </h3>

          {/* Doctors */}
          {globalResults.doctors.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--navy)', marginBottom: '.6rem' }}>👨‍⚕️ Doctors ({globalResults.doctors.length})</h4>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Name</th><th>Specialty</th><th>Country</th><th>Email</th><th>Status</th></tr></thead>
                  <tbody>
                    {globalResults.doctors.map(d => (
                      <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => { setTab('doctors'); setSearch(d.full_name); setGlobalSearch(''); setGlobalResults(null) }}>
                        <td><strong>{d.full_name}</strong></td>
                        <td>{d.specialty}</td>
                        <td>{d.nationality}</td>
                        <td>{d.email}</td>
                        <td><span style={{ color: d.status === 'approved' ? '#27ae60' : d.status === 'rejected' ? '#e74c3c' : '#f39c12', fontWeight: 700 }}>{d.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invitations */}
          {globalResults.invitations.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--navy)', marginBottom: '.6rem' }}>📄 Invitations ({globalResults.invitations.length})</h4>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Ref No.</th><th>Doctor</th><th>Conference</th><th>Issue Date</th></tr></thead>
                  <tbody>
                    {globalResults.invitations.map(inv => (
                      <tr key={inv.id}>
                        <td><strong>{inv.invitation_number}</strong></td>
                        <td>{doctors.find(d => d.id === inv.doctor_id)?.full_name || '—'}</td>
                        <td>{conferences.find(c => c.id === inv.conference_id)?.title || '—'}</td>
                        <td>{inv.issue_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conferences */}
          {globalResults.conferences.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--navy)', marginBottom: '.6rem' }}>🏛️ Conferences ({globalResults.conferences.length})</h4>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Title</th><th>Location</th><th>Start Date</th><th>End Date</th></tr></thead>
                  <tbody>
                    {globalResults.conferences.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.title}</strong></td>
                        <td>{c.location}</td>
                        <td>{c.start_date}</td>
                        <td>{c.end_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {globalResults.doctors.length === 0 && globalResults.invitations.length === 0 && globalResults.conferences.length === 0 && (
            <p className="muted">No results found for "{globalSearch}"</p>
          )}
        </div>
      )}
      {tab === 'overview' && (
        <div className="stat-cards">
          <div className="acard"><span className="acard-num">{doctors.length}</span><span className="acard-lbl">{t('admin_total_doctors')}</span></div>
          <div className="acard"><span className="acard-num">{invitations.length}</span><span className="acard-lbl">{t('admin_total_invitations')}</span></div>
          <div className="acard"><span className="acard-num">{conferences.length}</span><span className="acard-lbl">مؤتمر</span></div>
          <div className="acard"><span className="acard-num">{countries.length}</span><span className="acard-lbl">دولة</span></div>
        </div>
      )}

      {/* DOCTORS */}
      {tab === 'doctors' && (
        <div className="panel">
          <div className="filter-bar">
            <input className="auth-input" placeholder={t('admin_search')} value={search} onChange={e => setSearch(e.target.value)} />
            <select className="auth-input" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="">{t('admin_all_countries')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="auth-input" value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
              <option value="">{t('admin_all_specialties')}</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="export-row">
            <span className="muted">{t('admin_results')}: {filteredDoctors.length}</span>
            <div>
              <button className="btn-soft" onClick={exportExcel}>{t('admin_export_excel')}</button>
              <button className="btn-soft" onClick={exportPDF}>{t('admin_export_pdf')}</button>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>{t('admin_name')}</th><th>{t('admin_specialty')}</th><th>{t('admin_country')}</th><th>{t('admin_passport')}</th><th>{t('admin_actions')}</th></tr></thead>
              <tbody>
                {filteredDoctors.map(d => (
                  <tr key={d.id}>
                    <td>{d.full_name}</td><td>{d.specialty}</td><td>{d.nationality}</td><td>{d.passport_number}</td>
                    <td className="row-actions">
                      <button className="mini" style={{background:'#eef',color:'#0B2E5C'}} onClick={() => setDetailsDoctor(d)}>👁 التفاصيل</button>
                      <button className="mini" onClick={() => openDoctorFiles(d)}>{t('admin_files')}</button>
                      <button className="mini" onClick={() => setEditDoctor({ ...d })}>{t('admin_edit')}</button>
                      <button
                        className={d.visible === false ? 'mini' : 'mini danger'}
                        style={{ background: d.visible === false ? '#e8f7ee' : '#fff3cd', color: d.visible === false ? '#1a7a4f' : '#856404' }}
                        onClick={() => toggleVisible(d)}
                        title={d.visible === false ? 'Show in directory' : 'Hide from directory'}
                      >
                        {d.visible === false ? '👁 Show' : '🙈 Hide'}
                      </button>
                      <button className="mini" style={{background:'#e8f4ff',color:'#0B2E5C'}} onClick={async () => {
                        if (d.status !== 'approved') { alert('Approve this member first before issuing a certificate.'); return }
                        let cert = certRequests.find(r => r.doctor_id === d.id && r.status === 'approved')
                        // Manual fallback: create certificate if it doesn't exist
                        if (!cert) {
                          const issueDate = new Date().toISOString().split('T')[0]
                          const certNumber = `FGR-CERT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`
                          const { data: newCert, error } = await supabase.from('certificate_requests').insert([{
                            doctor_id: d.id, status: 'approved', issued_date: issueDate, cert_number: certNumber
                          }]).select().single()
                          if (error) { alert('Could not create certificate: ' + error.message); return }
                          cert = newCert
                          fetchCertRequests()
                        }
                        const { generateCertificatePDF } = await import('../utils/certificateGenerator.js')
                        const pdf = await generateCertificatePDF(d, cert.cert_number || 'FGR-CERT', cert.issued_date)
                        pdf.save(`Certificate-${(d.full_name||'').trim()}.pdf`)
                      }}>🎓 Cert</button>
                      <button className="mini danger" onClick={() => deleteDoctor(d.id)}>حذف</button>
                    </td>
                  </tr>
                ))}
                {filteredDoctors.length === 0 && <tr><td colSpan="5" className="muted center-td">لا يوجد أطباء مطابقون</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFERENCES */}
      {tab === 'conferences' && (
        <div className="panel">
          <div className="export-row">
            <h3>{t('admin_conferences')}</h3>
            <button className="btn-primary" onClick={() => setShowConfForm(!showConfForm)}>{showConfForm ? 'إلغاء' : 'مؤتمر جديد'}</button>
          </div>
          {showConfForm && (
            <form onSubmit={createConference} className="conf-form">
              <input className="auth-input" placeholder={t('admin_conf_title')} value={newConf.title} onChange={e => setNewConf({ ...newConf, title: e.target.value })} required />
              <input className="auth-input" placeholder={t('admin_conf_location')} value={newConf.location} onChange={e => setNewConf({ ...newConf, location: e.target.value })} required />
              <textarea className="auth-input" placeholder="الوصف" value={newConf.description} onChange={e => setNewConf({ ...newConf, description: e.target.value })} rows="2" />
              <div className="three-col">
                <label>البداية<input className="auth-input" type="date" value={newConf.start_date} onChange={e => setNewConf({ ...newConf, start_date: e.target.value })} required /></label>
                <label>النهاية<input className="auth-input" type="date" value={newConf.end_date} onChange={e => setNewConf({ ...newConf, end_date: e.target.value })} required /></label>
                <label>آخر تسجيل<input className="auth-input" type="date" value={newConf.registration_deadline} onChange={e => setNewConf({ ...newConf, registration_deadline: e.target.value })} required /></label>
              </div>
              <button className="btn-primary full" type="submit">حفظ المؤتمر</button>
            </form>
          )}
          <div className="card-grid">
            {conferences.map(c => (
              <div className="event-card" key={c.id}>
                <h3>{c.title}</h3>
                <p className="event-loc">📍 {c.location}</p>
                <p className="muted">{c.start_date} → {c.end_date}</p>
                <div className="row-actions" style={{ marginTop: '.5rem' }}>
                  <button className="mini" style={{background:'#e8f4ff',color:'#0B2E5C'}} onClick={() => setEditConference({...c})}>✏️ تعديل</button>
                  <button className="mini danger" onClick={() => deleteConference(c.id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUE INVITATION */}
      {tab === 'invite' && (
        <div className="panel">
          <h3>إصدار دعوة جديدة</h3>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '.88rem' }}>
            اختر الطبيب والمؤتمر ثم اضغط "⚡ إصدار فوري" — تاريخ السفر اختياري
          </p>
          <div className="inv-grid">
            <label>الطبيب *
              <select className="auth-input" value={inv.doctorId} onChange={e => setInv({ ...inv, doctorId: e.target.value })}>
                <option value="">— اختر الطبيب —</option>
                {doctors.filter(d => d.status === 'approved').map(d => (
                  <option key={d.id} value={d.id}>{(d.full_name || '').trim()} — {d.specialty}</option>
                ))}
              </select>
            </label>
            <label>المؤتمر *
              <select className="auth-input" value={inv.conferenceId} onChange={e => setInv({ ...inv, conferenceId: e.target.value })}>
                <option value="">— اختر المؤتمر —</option>
                {conferences.map(c => <option key={c.id} value={c.id}>{c.title} ({c.start_date})</option>)}
              </select>
            </label>
            <label>تاريخ السفر (اختياري)
              <input className="auth-input" type="date" value={inv.travelDate} onChange={e => setInv({ ...inv, travelDate: e.target.value })} />
            </label>
            <label>تاريخ الإصدار
              <input className="auth-input" type="date" value={inv.issueDate} onChange={e => setInv({ ...inv, issueDate: e.target.value })} />
            </label>
          </div>
          <div className="inv-btns">
            <button className="btn-primary" onClick={instantIssue}>{t('admin_instant_issue')}</button>
            <button className="btn-soft" onClick={startInvitation}>{t('admin_review_issue')}</button>
          </div>

          {invDoctorEdit && (
            <div className="review-box">
              <h4>راجع وعدّل بيانات الدعوة قبل الإصدار</h4>
              <p className="muted">رقم الدعوة: <strong>{inv.number}</strong> (يمكن تعديله)</p>
              <input className="auth-input" value={inv.number} onChange={e => setInv({ ...inv, number: e.target.value })} placeholder="رقم الدعوة" />
              <div className="two-col">
                <input className="auth-input" value={invDoctorEdit.full_name} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, full_name: e.target.value })} placeholder="Full Name" />
                <input className="auth-input" value={invDoctorEdit.passport_number} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, passport_number: e.target.value })} placeholder="Passport No." />
                <input className="auth-input" value={invDoctorEdit.specialty} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, specialty: e.target.value })} placeholder="Specialty" />
                <input className="auth-input" value={invDoctorEdit.hospital} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, hospital: e.target.value })} placeholder="Hospital" />
                <input className="auth-input" value={invDoctorEdit.nationality} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, nationality: e.target.value })} placeholder="Nationality" />
              </div>
              <button className="btn-primary full" onClick={confirmIssue}>{t('admin_confirm_issue')}</button>
            </div>
          )}
        </div>
      )}

      {/* INVITATIONS LIST */}
      {tab === 'invitations' && (
        <div className="panel">
          <h3>الدعوات الصادرة</h3>
          <InvSearch doctors={doctors} conferences={conferences} invitations={invitations} onDelete={deleteInvitation} onReprint={reprint} onEdit={setEditInvitation} />
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && (
        <div className="panel">
          <h3>البلاغات عن الحسابات الوهمية</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>المُبلَّغ عنه</th><th>السبب</th><th>بريد المُبلِّغ</th><th>التاريخ</th><th>إجراء</th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td>{r.reported_name}</td>
                    <td>{r.reason}</td>
                    <td>{r.reporter_email || '—'}</td>
                    <td>{(r.created_at || '').split('T')[0]}</td>
                    <td><button className="mini danger" onClick={() => deleteReport(r.id)}>حذف</button></td>
                  </tr>
                ))}
                {reports.length === 0 && <tr><td colSpan="5" className="muted center-td">لا توجد بلاغات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* PENDING APPROVALS */}
      {/* ISSUE CERTIFICATE (manual) */}
      {tab === 'issue-cert' && (
        <div className="panel">
          <h3 style={{ color: 'var(--navy)', marginBottom: '.5rem' }}>🎓 Issue Membership Certificate</h3>
          <p className="muted" style={{ fontSize: '.88rem', marginBottom: '1rem' }}>
            Certificates are normally issued automatically on approval. Use this as a manual backup to issue or re-download a certificate for an approved member.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem', maxWidth: 500 }}>
            <select className="auth-input" value={certDoctorId} onChange={e => { setCertDoctorId(e.target.value); setCertMsg('') }}>
              <option value="">— Select Approved Member —</option>
              {doctors.filter(d => d.status === 'approved').map(d => (
                <option key={d.id} value={d.id}>{(d.full_name || '').trim()} — {d.email}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={issueCertManual}>🎓 Issue / Download Certificate</button>
          </div>
          {certMsg && (
            <div style={{ padding: '.7rem 1rem', borderRadius: 8, marginTop: '1rem', fontSize: '.9rem',
              background: certMsg.startsWith('✅') ? '#e8f7ee' : certMsg.startsWith('ℹ️') ? '#e8f4ff' : '#fdecea',
              color: certMsg.startsWith('✅') ? '#1a7a4f' : certMsg.startsWith('ℹ️') ? '#0B2E5C' : '#c0392b' }}>
              {certMsg}
            </div>
          )}
        </div>
      )}

      {/* ADMINS MANAGEMENT */}
      {tab === 'admins' && (
        <div className="panel">
          <h3 style={{ color: 'var(--navy)', marginBottom: '.5rem' }}>🛡️ Admin Management</h3>
          <p className="muted" style={{ fontSize: '.88rem', marginBottom: '1rem' }}>
            Grant admin access to an existing member by entering their registered email.
          </p>
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input className="auth-input ltr-input" dir="ltr" style={{ flex: 1, minWidth: 240 }}
              placeholder="member@email.com"
              value={adminEmailInput}
              onChange={e => { setAdminEmailInput(e.target.value); setAdminMsg('') }} />
            <button className="btn-primary" onClick={grantAdminByEmail}>Grant Admin Access</button>
          </div>
          {adminMsg && (
            <div style={{ padding: '.7rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '.9rem',
              background: adminMsg.startsWith('✅') ? '#e8f7ee' : adminMsg.startsWith('ℹ️') ? '#e8f4ff' : '#fdecea',
              color: adminMsg.startsWith('✅') ? '#1a7a4f' : adminMsg.startsWith('ℹ️') ? '#0B2E5C' : '#c0392b' }}>
              {adminMsg}
            </div>
          )}

          <h4 style={{ color: 'var(--navy)', marginTop: '1.5rem', marginBottom: '.8rem' }}>Current Admins</h4>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
              <tbody>
                {doctors.filter(d => d.is_admin).map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.full_name}</strong></td>
                    <td>{d.email}</td>
                    <td className="row-actions">
                      <button className="mini danger" onClick={() => revokeAdmin(d.id, d.full_name)}>Remove Admin</button>
                    </td>
                  </tr>
                ))}
                {doctors.filter(d => d.is_admin).length === 0 && (
                  <tr><td colSpan="3" className="muted center-td">No admins yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PENDING */}
      {tab === 'pending' && (
        <div className="panel">
          <h3>Pending Membership Approvals</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Name</th><th>Specialty</th><th>Country</th><th>Email</th><th>Actions</th></tr></thead>
              <tbody>
                {pendingDoctors.map(d => (
                  <tr key={d.id}>
                    <td>{d.full_name}</td><td>{d.specialty}</td><td>{d.nationality}</td><td>{d.email}</td>
                    <td className="row-actions">
                      <button className="mini" style={{background:'#eef',color:'#0B2E5C'}} onClick={() => setDetailsDoctor(d)}>👁 التفاصيل</button>
                      <button className="mini" style={{background:'#e8f4ff',color:'#0B2E5C'}} onClick={() => openDoctorFiles(d)}>📁 {t('admin_files')}</button>
                      <button className="mini admin-btn" onClick={() => approveDoctor(d.id)}>✅ Approve</button>
                      <button className="mini danger" onClick={() => rejectDoctor(d.id)}>❌ Reject</button>
                    </td>
                  </tr>
                ))}
                {pendingDoctors.length === 0 && <tr><td colSpan="5" className="muted center-td">No pending approvals</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITATION REQUESTS */}
      {tab === 'inv-requests' && (
        <div className="panel">
          <h3>New Invitation Requests</h3>
          <p className="muted" style={{ fontSize: '.85rem', marginBottom: '1rem' }}>Pending requests awaiting action. Once issued, they move to the Requests Archive.</p>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Specialty</th><th>Passport</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {invitationRequests.filter(r => r.status === 'new').map(r => (
                  <tr key={r.id}>
                    <td>{r.full_name}</td><td>{r.email}</td><td>{r.specialty || '—'}</td>
                    <td>{r.passport_number}</td><td>{(r.created_at || '').split('T')[0]}</td>
                    <td className="row-actions">
                      <button className="mini admin-btn" onClick={() => issueFromRequest(r)}>⚡ Issue</button>
                      <button className="mini danger" onClick={() => deleteInvitationRequest(r.id)}>حذف</button>
                    </td>
                  </tr>
                ))}
                {invitationRequests.filter(r => r.status === 'new').length === 0 && <tr><td colSpan="6" className="muted center-td">No new requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITATION REQUESTS ARCHIVE */}
      {tab === 'inv-archive' && (
        <div className="panel">
          <h3>📦 Requests Archive</h3>
          <p className="muted" style={{ fontSize: '.85rem', marginBottom: '1rem' }}>Invitation requests that have already been issued.</p>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Specialty</th><th>Passport</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {invitationRequests.filter(r => r.status === 'issued').map(r => (
                  <tr key={r.id}>
                    <td>{r.full_name}</td><td>{r.email}</td><td>{r.specialty || '—'}</td>
                    <td>{r.passport_number}</td><td>{(r.created_at || '').split('T')[0]}</td>
                    <td><span style={{ fontSize: '.8rem', color: '#27ae60', fontWeight: 700 }}>✅ Issued</span></td>
                    <td className="row-actions">
                      <button className="mini danger" onClick={() => deleteInvitationRequest(r.id)}>حذف</button>
                    </td>
                  </tr>
                ))}
                {invitationRequests.filter(r => r.status === 'issued').length === 0 && <tr><td colSpan="7" className="muted center-td">Archive is empty</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CERTIFICATE REQUESTS */}
      {tab === 'cert-requests' && (
        <div className="panel">
          <h3>Membership Certificate Requests</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Doctor</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {certRequests.map(r => (
                  <tr key={r.id}>
                    <td>{r.doctors?.full_name || '—'}</td>
                    <td>{r.status}</td>
                    <td>{(r.created_at || '').split('T')[0]}</td>
                    <td>
                      {r.status === 'pending' && (
                        <button className="mini admin-btn" onClick={() => approveCert(r.id)}>✅ Approve</button>
                      )}
                      {r.status === 'approved' && (
                        <button className="mini" style={{background:'#e8f4ff',color:'#0B2E5C'}} onClick={() => setEditCert({...r})}>✏️ Edit</button>
                      )}
                      {r.status === 'approved' && r.issued_date && (() => {
                        const doc = doctors.find(d => d.id === r.doctor_id)
                        if (!doc) return null
                        return (
                          <button className="mini" onClick={async () => {
                            const { generateCertificatePDF } = await import('../utils/certificateGenerator.js')
                            const pdf = await generateCertificatePDF(doc, r.cert_number || 'FGR-CERT', r.issued_date)
                            pdf.save(`FGR-Certificate-${doc.full_name}.pdf`)
                          }}>⬇ PDF</button>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
                {certRequests.length === 0 && <tr><td colSpan="4" className="muted center-td">No requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MEMBER ACTIVITIES */}
      {tab === 'activities' && (
        <div className="panel">
          <h3>{t('admin_activities')}</h3>
          <div className="card-grid">
            {memberActivities.map(a => (
              <div key={a.id} className="event-card">
                {a.image_url && <img src={a.image_url} alt={a.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: '.6rem' }} />}
                <h3>{a.title}</h3>
                <p className="muted" style={{ fontSize: '.85rem' }}>By: {a.doctor_name}</p>
                <p style={{ fontSize: '.9rem', margin: '.4rem 0' }}>{a.description}</p>
                <button className="mini danger" onClick={() => deleteActivity(a.id)}>Delete</button>
              </div>
            ))}
            {memberActivities.length === 0 && <p className="muted">No activities posted yet.</p>}
          </div>
        </div>
      )}



      {/* EDIT INVITATION MODAL */}
      {editInvitation && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{color:'var(--navy)',marginBottom:'1rem'}}>✏️ Edit Invitation</h3>
            <p className="muted" style={{marginBottom:'1rem',fontSize:'.85rem'}}>Ref: <strong>{editInvitation.invitation_number}</strong> — same number will be kept</p>
            <div style={{display:'flex',flexDirection:'column',gap:'.7rem'}}>
              <label className="auth-label">Doctor</label>
              <select className="auth-input" value={editInvitation.doctor_id} onChange={e => setEditInvitation({...editInvitation, doctor_id: e.target.value})}>
                {doctors.filter(d=>d.status==='approved').map(d => <option key={d.id} value={d.id}>{(d.full_name||'').trim()}</option>)}
              </select>
              <label className="auth-label" style={{color:'#c0392b'}}>Correct Name Spelling (updates passport, profile & invitation)</label>
              <input className="auth-input ltr-input" dir="ltr"
                placeholder={(doctors.find(d => d.id === editInvitation.doctor_id)?.full_name || '').trim()}
                value={editInvitation.corrected_name || ''}
                onChange={e => setEditInvitation({...editInvitation, corrected_name: e.target.value})} />
              <p className="muted" style={{fontSize:'.78rem',marginTop:'-.3rem'}}>
                ⚠️ Leave empty to keep the current name. Enter a name only to fix spelling — it must match the passport exactly.
              </p>
              <label className="auth-label">Conference</label>
              <select className="auth-input" value={editInvitation.conference_id} onChange={e => setEditInvitation({...editInvitation, conference_id: e.target.value})}>
                {conferences.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <label className="auth-label">Issue Date</label>
              <input className="auth-input" type="date" value={editInvitation.issue_date||''} onChange={e => setEditInvitation({...editInvitation, issue_date: e.target.value})} />
              <label className="auth-label">Travel Date</label>
              <input className="auth-input" type="date" value={editInvitation.travel_date||''} onChange={e => setEditInvitation({...editInvitation, travel_date: e.target.value})} />
            </div>
            <div className="two-col" style={{marginTop:'1rem'}}>
              <button className="btn-primary" onClick={saveEditInvitation}>💾 Save & Reprint PDF</button>
              <button className="btn-soft" onClick={() => setEditInvitation(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CERTIFICATE MODAL */}
      {editCert && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{color:'var(--navy)',marginBottom:'1rem'}}>✏️ Edit Certificate</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'.7rem'}}>
              <label className="auth-label">Certificate Number</label>
              <input className="auth-input" value={editCert.cert_number||''} onChange={e => setEditCert({...editCert, cert_number: e.target.value})} />
              <label className="auth-label">Issue Date</label>
              <input className="auth-input" type="date" value={editCert.issued_date||''} onChange={e => setEditCert({...editCert, issued_date: e.target.value})} />
            </div>
            <div className="two-col" style={{marginTop:'1rem'}}>
              <button className="btn-primary" onClick={saveEditCert}>💾 Save</button>
              <button className="btn-soft" onClick={() => setEditCert(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONFERENCE MODAL */}
      {editConference && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{color:'var(--navy)',marginBottom:'1rem'}}>✏️ Edit Conference / Event</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'.7rem'}}>
              <input className="auth-input" placeholder="Title" value={editConference.title||''} onChange={e => setEditConference({...editConference, title: e.target.value})} />
              <input className="auth-input" placeholder="Location" value={editConference.location||''} onChange={e => setEditConference({...editConference, location: e.target.value})} />
              <select className="auth-input" value={editConference.event_type||'conference'} onChange={e => setEditConference({...editConference, event_type: e.target.value})}>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop / ورشة عمل</option>
                <option value="seminar">Seminar / ندوة</option>
                <option value="meeting">Association Meeting / اجتماع إدارة</option>
              </select>
              <label className="auth-label">Start Date</label>
              <input className="auth-input" type="date" value={editConference.start_date||''} onChange={e => setEditConference({...editConference, start_date: e.target.value})} />
              <label className="auth-label">End Date</label>
              <input className="auth-input" type="date" value={editConference.end_date||''} onChange={e => setEditConference({...editConference, end_date: e.target.value})} />
              <input className="auth-input" placeholder="Description" value={editConference.description||''} onChange={e => setEditConference({...editConference, description: e.target.value})} />
            </div>
            <div className="two-col" style={{marginTop:'1rem'}}>
              <button className="btn-primary" onClick={saveEditConference}>💾 Save</button>
              <button className="btn-soft" onClick={() => setEditConference(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* DOCTOR FULL DETAILS MODAL */}
      {detailsDoctor && (
        <div className="modal-overlay" onClick={() => setDetailsDoctor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3 style={{ color: 'var(--navy)', marginBottom: '1rem' }}>👤 {detailsDoctor.full_name}</h3>
            <div className="profile-grid">
              {[
                ['Full Name', detailsDoctor.full_name],
                ['Email', detailsDoctor.email],
                ['Phone', detailsDoctor.phone],
                ['Date of Birth', detailsDoctor.date_of_birth],
                ['Profession', detailsDoctor.profession],
                ['Specialty', detailsDoctor.specialty],
                ['Workplace', detailsDoctor.hospital],
                ['Affiliation', detailsDoctor.affiliation],
                ['Passport No.', detailsDoctor.passport_number],
                ['Work ID / Syndicate No.', detailsDoctor.syndicate_id],
                ['Nationality', detailsDoctor.nationality],
                ['City', detailsDoctor.city],
                ['Governorate', detailsDoctor.governorate],
                ['Fertility Specialist', detailsDoctor.fertility_specialist ? 'Yes' : 'No'],
                ['Status', detailsDoctor.status],
                ['Registered', (detailsDoctor.created_at || '').split('T')[0]],
              ].map(([label, value]) => (
                <div key={label} className="profile-field">
                  <span className="profile-label">{label}</span>
                  <span className="profile-value">{value || '—'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={() => { openDoctorFiles(detailsDoctor); setDetailsDoctor(null) }}>📁 View Documents</button>
              <button className="btn-soft" onClick={() => setDetailsDoctor(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
      {/* VIEW FILES MODAL */}
      {viewDoctor && (
        <div className="modal-overlay" onClick={() => setViewDoctor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>مستمسكات: {viewDoctor.full_name}</h3>
            {docFiles.length === 0 ? <p className="muted">لم يرفع هذا الطبيب أي ملفات بعد.</p> : (
              <div className="files-grid">
                {docFiles.map(f => (
                  <button key={f.id} onClick={() => openSignedFile(f.file_url)} className="file-chip" style={{ cursor: 'pointer', border: 'none' }}>
                    📄 {f.document_type}
                  </button>
                ))}
              </div>
            )}
            <button className="btn-soft" onClick={() => setViewDoctor(null)}>إغلاق</button>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {editDoctor && (
        <div className="modal-overlay" onClick={() => setEditDoctor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>تعديل بيانات الطبيب</h3>
            <form onSubmit={saveDoctor} className="auth-form">
              <input className="auth-input" value={editDoctor.full_name || ''} onChange={e => setEditDoctor({ ...editDoctor, full_name: e.target.value })} placeholder="Full Name" />
              <input className="auth-input" value={editDoctor.specialty || ''} onChange={e => setEditDoctor({ ...editDoctor, specialty: e.target.value })} placeholder="Specialty" />
              <input className="auth-input" value={editDoctor.hospital || ''} onChange={e => setEditDoctor({ ...editDoctor, hospital: e.target.value })} placeholder="Hospital" />
              <input className="auth-input" value={editDoctor.affiliation || ''} onChange={e => setEditDoctor({ ...editDoctor, affiliation: e.target.value })} placeholder="Affiliation / Institution" />
              <input className="auth-input" value={editDoctor.passport_number || ''} onChange={e => setEditDoctor({ ...editDoctor, passport_number: e.target.value })} placeholder="Passport No." />
              <input className="auth-input" value={editDoctor.syndicate_id || ''} onChange={e => setEditDoctor({ ...editDoctor, syndicate_id: e.target.value })} placeholder="Syndicate ID" />
              <input className="auth-input" value={editDoctor.nationality || ''} onChange={e => setEditDoctor({ ...editDoctor, nationality: e.target.value })} placeholder="Nationality" />
              <input className="auth-input" value={editDoctor.city || ''} onChange={e => setEditDoctor({ ...editDoctor, city: e.target.value })} placeholder="City" />
              <input className="auth-input" value={editDoctor.governorate || ''} onChange={e => setEditDoctor({ ...editDoctor, governorate: e.target.value })} placeholder="Governorate" />
              <input className="auth-input" type="number" value={editDoctor.years_of_experience || ''} onChange={e => setEditDoctor({ ...editDoctor, years_of_experience: e.target.value })} placeholder="سنوات الخبرة" />
              <div className="two-col">
                <button className="btn-primary" type="submit">حفظ</button>
                <button className="btn-soft" type="button" onClick={() => setEditDoctor(null)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REQUESTS */}
      {tab === 'edit-requests' && (
        <div className="panel">
          <h3>Profile Edit Requests</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Doctor</th><th>Requested Changes</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {editRequests.map(r => (
                  <tr key={r.id}>
                    <td>{r.doctors?.full_name || '—'}</td>
                    <td style={{ fontSize: '.82rem', maxWidth: 200 }}>
                      {Object.entries(r.requested_changes || {}).map(([k, v]) => (
                        <div key={k}><strong>{k}:</strong> {v}</div>
                      ))}
                    </td>
                    <td>{(r.created_at || '').split('T')[0]}</td>
                    <td><span style={{ color: r.status === 'approved' ? '#27ae60' : r.status === 'rejected' ? '#e74c3c' : '#f39c12', fontWeight: 700 }}>{r.status}</span></td>
                    <td className="row-actions">
                      {r.status === 'pending' && (<>
                        <button className="mini admin-btn" onClick={() => applyEditRequest(r)}>✅ Apply</button>
                        <button className="mini danger" onClick={() => rejectEditRequest(r.id)}>❌ Reject</button>
                      </>)}
                    </td>
                  </tr>
                ))}
                {editRequests.length === 0 && <tr><td colSpan="5" className="muted center-td">No edit requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

function InvSearch({ doctors, conferences, invitations, onDelete, onReprint, onEdit }) {
  const [q, setQ] = React.useState('')
  const filtered = invitations.filter(i => {
    if (!q.trim()) return true
    const s = q.toLowerCase()
    const d = doctors.find(x => x.id === i.doctor_id)
    const c = conferences.find(x => x.id === i.conference_id)
    return (
      (i.invitation_number || '').toLowerCase().includes(s) ||
      (d?.full_name || '').toLowerCase().includes(s) ||
      (d?.passport_number || '').toLowerCase().includes(s) ||
      (c?.title || '').toLowerCase().includes(s)
    )
  })
  return (
    <>
      <div className="global-search-bar" style={{ marginBottom: '1rem' }}>
        <span className="global-search-icon">🔍</span>
        <input className="global-search-input"
          placeholder="Search by name, invitation number, or conference..."
          value={q} onChange={e => setQ(e.target.value)} />
        {q && <button className="global-search-clear" onClick={() => setQ('')}>✕</button>}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Doctor</th><th>Invitation No.</th><th>Conference</th><th>Issue Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(i => {
              const d = doctors.find(x => x.id === i.doctor_id)
              const c = conferences.find(x => x.id === i.conference_id)
              return (
                <tr key={i.id}>
                  <td>{d?.full_name || '—'}</td>
                  <td><strong>{i.invitation_number}</strong></td>
                  <td>{c?.title || '—'}</td>
                  <td>{i.issue_date}</td>
                  <td className="row-actions">
                    <button className="mini" style={{background:'#e8f4ff',color:'#0B2E5C'}} onClick={() => onEdit(i)}>✏️ Edit</button>
                    <button className="mini" onClick={() => onReprint(i)}>PDF</button>
                    <button className="mini danger" onClick={() => onDelete(i.id)}>حذف</button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="muted center-td">
                {invitations.length === 0 ? 'No invitations yet' : `No results for "${q}"`}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: '.6rem', fontSize: '.85rem' }}>
        Showing {filtered.length} of {invitations.length} invitations
      </p>
    </>
  )
}

