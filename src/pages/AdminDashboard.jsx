import React, { useState, useEffect } from 'react'
import { supabase, generateInvitationNumber } from '../supabaseClient'
import { generateInvitationPDF } from '../utils/pdfGenerator'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [doctors, setDoctors] = useState([])
  const [conferences, setConferences] = useState([])
  const [invitations, setInvitations] = useState([])
  const [reports, setReports] = useState([])

  // doctor search/filter
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('')

  // modals
  const [viewDoctor, setViewDoctor] = useState(null)
  const [editDoctor, setEditDoctor] = useState(null)
  const [docFiles, setDocFiles] = useState([])

  // conference form
  const [showConfForm, setShowConfForm] = useState(false)
  const [newConf, setNewConf] = useState({ title: '', location: '', start_date: '', end_date: '', registration_deadline: '', description: '' })

  // invitation builder (editable before issuing)
  const [inv, setInv] = useState({ doctorId: '', conferenceId: '', travelDate: '', issueDate: new Date().toISOString().split('T')[0], number: '' })
  const [invDoctorEdit, setInvDoctorEdit] = useState(null)

  useEffect(() => { refreshAll() }, [])

  const refreshAll = () => { fetchDoctors(); fetchConferences(); fetchInvitations(); fetchReports() }
  const fetchDoctors = async () => { const { data } = await supabase.from('doctors').select('*').order('created_at', { ascending: false }); setDoctors(data || []) }
  const fetchConferences = async () => { const { data } = await supabase.from('conferences').select('*'); setConferences(data || []) }
  const fetchInvitations = async () => { const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false }); setInvitations(data || []) }
  const fetchReports = async () => { const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }); setReports(data || []) }

  // ---------- filters ----------
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
    const { data } = await supabase.from('documents').select('*').eq('doctor_id', doctor.id)
    const withUrls = (data || []).map(doc => ({
      ...doc,
      url: supabase.storage.from('doctor-documents').getPublicUrl(doc.file_url).data.publicUrl
    }))
    setDocFiles(withUrls)
  }

  // ---------- conference ----------
  const createConference = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('conferences').insert([newConf])
    if (!error) { setNewConf({ title: '', location: '', start_date: '', end_date: '', registration_deadline: '', description: '' }); setShowConfForm(false); fetchConferences() }
    else alert(error.message)
  }
  const deleteConference = async (id) => { if (confirm('حذف هذا المؤتمر؟')) { await supabase.from('conferences').delete().eq('id', id); fetchConferences() } }

  // ---------- doctor edit/delete ----------
  const saveDoctor = async (e) => {
    e.preventDefault()
    const { id, full_name, specialty, hospital, nationality, passport_number, years_of_experience, email } = editDoctor
    const { error } = await supabase.from('doctors').update({
      full_name, specialty, hospital, nationality, passport_number,
      years_of_experience: years_of_experience ? parseInt(years_of_experience) : null, email
    }).eq('id', id)
    if (!error) { setEditDoctor(null); fetchDoctors() } else alert(error.message)
  }
  const deleteDoctor = async (id) => {
    if (confirm('حذف هذا الطبيب نهائياً؟ سيتم حذف دعواته أيضاً.')) {
      await supabase.from('doctors').delete().eq('id', id)
      fetchDoctors(); fetchInvitations()
    }
  }

  // ---------- export ----------
  const exportExcel = () => {
    const rows = filteredDoctors.map(d => ({
      'Name': d.full_name, 'Specialty': d.specialty, 'Hospital': d.hospital,
      'Passport': d.passport_number, 'Nationality': d.nationality,
      'Years': d.years_of_experience, 'Email': d.email
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors')
    XLSX.writeFile(wb, 'doctors.xlsx')
  }
  const exportPDF = () => {
    const pdf = new jsPDF()
    pdf.setFontSize(16); pdf.text('Fertility Global Research - Doctors', 14, 18)
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
    if (!inv.doctorId || !inv.conferenceId || !inv.travelDate) {
      alert('اختر الطبيب والمؤتمر وتاريخ السفر أولاً')
      return
    }
    const doctor = doctors.find(d => d.id === inv.doctorId)
    const conference = conferences.find(c => c.id === inv.conferenceId)
    const invNumber = inv.number || generateInvitationNumber()
    const issueDate = inv.issueDate || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.from('invitations').insert([{
      doctor_id: inv.doctorId,
      conference_id: inv.conferenceId,
      invitation_number: invNumber,
      issue_date: issueDate,
      travel_date: inv.travelDate,
      status: 'issued'
    }]).select()

    if (error) { alert(error.message); return }

    const pdf = await generateInvitationPDF(doctor, conference, data[0])
    pdf.save(`${invNumber}.pdf`)
    setInv({ doctorId: '', conferenceId: '', travelDate: '', issueDate: new Date().toISOString().split('T')[0], number: '' })
    setInvDoctorEdit(null)
    fetchInvitations()
  }

  // ---------- admin assignment ----------
  const toggleAdmin = async (doctor) => {
    const newVal = !doctor.is_admin
    await supabase.from('doctors').update({ is_admin: newVal }).eq('id', doctor.id)
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
    const pdf = await generateInvitationPDF(doctor, conference, invitation)
    pdf.save(`${invitation.invitation_number}.pdf`)
  }
  const deleteInvitation = async (id) => { if (confirm('حذف هذه الدعوة؟')) { await supabase.from('invitations').delete().eq('id', id); fetchInvitations() } }
  const deleteReport = async (id) => { if (confirm('حذف هذا البلاغ؟')) { await supabase.from('reports').delete().eq('id', id); fetchReports() } }

  return (
    <div className="admin">
      <h1>لوحة التحكم</h1>

      {/* tabs */}
      <div className="admin-tabs">
        <button className={tab === 'overview' ? 'atab active' : 'atab'} onClick={() => setTab('overview')}>الإحصائيات</button>
        <button className={tab === 'doctors' ? 'atab active' : 'atab'} onClick={() => setTab('doctors')}>الأطباء</button>
        <button className={tab === 'conferences' ? 'atab active' : 'atab'} onClick={() => setTab('conferences')}>المؤتمرات</button>
        <button className={tab === 'invite' ? 'atab active' : 'atab'} onClick={() => setTab('invite')}>إصدار دعوة</button>
        <button className={tab === 'invitations' ? 'atab active' : 'atab'} onClick={() => setTab('invitations')}>الدعوات</button>
        <button className={tab === 'reports' ? 'atab active' : 'atab'} onClick={() => setTab('reports')}>البلاغات{reports.length ? ` (${reports.length})` : ''}</button>
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="stat-cards">
          <div className="acard"><span className="acard-num">{doctors.length}</span><span className="acard-lbl">طبيب مسجّل</span></div>
          <div className="acard"><span className="acard-num">{invitations.length}</span><span className="acard-lbl">دعوة صادرة</span></div>
          <div className="acard"><span className="acard-num">{conferences.length}</span><span className="acard-lbl">مؤتمر</span></div>
          <div className="acard"><span className="acard-num">{countries.length}</span><span className="acard-lbl">دولة</span></div>
        </div>
      )}

      {/* DOCTORS */}
      {tab === 'doctors' && (
        <div className="panel">
          <div className="filter-bar">
            <input className="auth-input" placeholder="بحث بالاسم / الإيميل / الجواز" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="auth-input" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="">كل الدول</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="auth-input" value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}>
              <option value="">كل التخصصات</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="export-row">
            <span className="muted">النتائج: {filteredDoctors.length}</span>
            <div>
              <button className="btn-soft" onClick={exportExcel}>تصدير Excel</button>
              <button className="btn-soft" onClick={exportPDF}>تصدير PDF</button>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>الاسم</th><th>التخصص</th><th>الدولة</th><th>الجواز</th><th>إجراءات</th></tr></thead>
              <tbody>
                {filteredDoctors.map(d => (
                  <tr key={d.id}>
                    <td>{d.full_name}</td><td>{d.specialty}</td><td>{d.nationality}</td><td>{d.passport_number}</td>
                    <td className="row-actions">
                      <button className="mini" onClick={() => openDoctorFiles(d)}>الملفات</button>
                      <button className="mini" onClick={() => setEditDoctor({ ...d })}>تعديل</button>
                      <button
                        className={d.is_admin ? 'mini danger' : 'mini admin-btn'}
                        onClick={() => toggleAdmin(d)}
                        title={d.is_admin ? 'إلغاء صلاحية الأدمن' : 'تعيين كأدمن'}
                      >
                        {d.is_admin ? '🔴 إلغاء أدمن' : '🟢 تعيين أدمن'}
                      </button>
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
            <h3>المؤتمرات</h3>
            <button className="btn-primary" onClick={() => setShowConfForm(!showConfForm)}>{showConfForm ? 'إلغاء' : 'مؤتمر جديد'}</button>
          </div>
          {showConfForm && (
            <form onSubmit={createConference} className="conf-form">
              <input className="auth-input" placeholder="عنوان المؤتمر" value={newConf.title} onChange={e => setNewConf({ ...newConf, title: e.target.value })} required />
              <input className="auth-input" placeholder="المكان" value={newConf.location} onChange={e => setNewConf({ ...newConf, location: e.target.value })} required />
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
                <button className="mini danger" onClick={() => deleteConference(c.id)}>حذف</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUE INVITATION */}
      {tab === 'invite' && (
        <div className="panel">
          <h3>إصدار دعوة جديدة</h3>
          <div className="inv-grid">
            <label>الطبيب
              <select className="auth-input" value={inv.doctorId} onChange={e => setInv({ ...inv, doctorId: e.target.value })}>
                <option value="">— اختر —</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.specialty}</option>)}
              </select>
            </label>
            <label>المؤتمر
              <select className="auth-input" value={inv.conferenceId} onChange={e => setInv({ ...inv, conferenceId: e.target.value })}>
                <option value="">— اختر —</option>
                {conferences.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label>تاريخ السفر
              <input className="auth-input" type="date" value={inv.travelDate} onChange={e => setInv({ ...inv, travelDate: e.target.value })} />
            </label>
            <label>تاريخ الإصدار
              <input className="auth-input" type="date" value={inv.issueDate} onChange={e => setInv({ ...inv, issueDate: e.target.value })} />
            </label>
          </div>
          <div className="inv-btns">
            <button className="btn-primary" onClick={instantIssue}>⚡ إصدار فوري + تنزيل PDF</button>
            <button className="btn-soft" onClick={startInvitation}>مراجعة قبل الإصدار</button>
          </div>

          {invDoctorEdit && (
            <div className="review-box">
              <h4>راجع وعدّل بيانات الدعوة قبل الإصدار</h4>
              <p className="muted">رقم الدعوة: <strong>{inv.number}</strong> (يمكن تعديله)</p>
              <input className="auth-input" value={inv.number} onChange={e => setInv({ ...inv, number: e.target.value })} placeholder="رقم الدعوة" />
              <div className="two-col">
                <input className="auth-input" value={invDoctorEdit.full_name} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, full_name: e.target.value })} placeholder="الاسم" />
                <input className="auth-input" value={invDoctorEdit.passport_number} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, passport_number: e.target.value })} placeholder="الجواز" />
                <input className="auth-input" value={invDoctorEdit.specialty} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, specialty: e.target.value })} placeholder="التخصص" />
                <input className="auth-input" value={invDoctorEdit.hospital} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, hospital: e.target.value })} placeholder="المستشفى" />
                <input className="auth-input" value={invDoctorEdit.nationality} onChange={e => setInvDoctorEdit({ ...invDoctorEdit, nationality: e.target.value })} placeholder="الجنسية" />
              </div>
              <button className="btn-primary full" onClick={confirmIssue}>إصدار الدعوة وتنزيل PDF</button>
            </div>
          )}
        </div>
      )}

      {/* INVITATIONS LIST */}
      {tab === 'invitations' && (
        <div className="panel">
          <h3>الدعوات الصادرة</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>الطبيب</th><th>رقم الدعوة</th><th>المؤتمر</th><th>الإصدار</th><th>إجراءات</th></tr></thead>
              <tbody>
                {invitations.map(i => {
                  const d = doctors.find(x => x.id === i.doctor_id)
                  const c = conferences.find(x => x.id === i.conference_id)
                  return (
                    <tr key={i.id}>
                      <td>{d?.full_name || '—'}</td><td>{i.invitation_number}</td><td>{c?.title || '—'}</td><td>{i.issue_date}</td>
                      <td className="row-actions">
                        <button className="mini" onClick={() => reprint(i)}>PDF</button>
                        <button className="mini danger" onClick={() => deleteInvitation(i.id)}>حذف</button>
                      </td>
                    </tr>
                  )
                })}
                {invitations.length === 0 && <tr><td colSpan="5" className="muted center-td">لا توجد دعوات</td></tr>}
              </tbody>
            </table>
          </div>
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

      {/* VIEW FILES MODAL */}
      {viewDoctor && (
        <div className="modal-overlay" onClick={() => setViewDoctor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>مستمسكات: {viewDoctor.full_name}</h3>
            {docFiles.length === 0 ? <p className="muted">لم يرفع هذا الطبيب أي ملفات بعد.</p> : (
              <div className="files-grid">
                {docFiles.map(f => (
                  <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="file-chip">
                    📄 {f.document_type}
                  </a>
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
              <input className="auth-input" value={editDoctor.full_name || ''} onChange={e => setEditDoctor({ ...editDoctor, full_name: e.target.value })} placeholder="الاسم" />
              <input className="auth-input" value={editDoctor.specialty || ''} onChange={e => setEditDoctor({ ...editDoctor, specialty: e.target.value })} placeholder="التخصص" />
              <input className="auth-input" value={editDoctor.hospital || ''} onChange={e => setEditDoctor({ ...editDoctor, hospital: e.target.value })} placeholder="المستشفى" />
              <input className="auth-input" value={editDoctor.passport_number || ''} onChange={e => setEditDoctor({ ...editDoctor, passport_number: e.target.value })} placeholder="الجواز" />
              <input className="auth-input" value={editDoctor.nationality || ''} onChange={e => setEditDoctor({ ...editDoctor, nationality: e.target.value })} placeholder="الجنسية" />
              <input className="auth-input" type="number" value={editDoctor.years_of_experience || ''} onChange={e => setEditDoctor({ ...editDoctor, years_of_experience: e.target.value })} placeholder="سنوات الخبرة" />
              <div className="two-col">
                <button className="btn-primary" type="submit">حفظ</button>
                <button className="btn-soft" type="button" onClick={() => setEditDoctor(null)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
