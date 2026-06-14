import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { generateInvitationPDF } from '../utils/pdfGenerator'
import { generateInvitationNumber } from '../supabaseClient'

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([])
  const [conferences, setConferences] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedConference, setSelectedConference] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [invitations, setInvitations] = useState([])
  const [showNewConfForm, setShowNewConfForm] = useState(false)
  const [newConf, setNewConf] = useState({
    title: '',
    location: '',
    start_date: '',
    end_date: '',
    registration_deadline: ''
  })

  useEffect(() => {
    fetchDoctors()
    fetchConferences()
    fetchInvitations()
  }, [])

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*')
    setDoctors(data || [])
  }

  const fetchConferences = async () => {
    const { data } = await supabase.from('conferences').select('*')
    setConferences(data || [])
  }

  const fetchInvitations = async () => {
    const { data } = await supabase.from('invitations').select('*')
    setInvitations(data || [])
  }

  const createConference = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('conferences').insert([newConf])
    if (!error) {
      setNewConf({ title: '', location: '', start_date: '', end_date: '', registration_deadline: '' })
      setShowNewConfForm(false)
      fetchConferences()
    }
  }

  const issueInvitation = async () => {
    if (!selectedDoctor || !selectedConference || !travelDate) {
      alert('الرجاء ملء جميع الحقول')
      return
    }

    const invNumber = generateInvitationNumber()
    const { data, error } = await supabase.from('invitations').insert([{
      doctor_id: selectedDoctor.id,
      conference_id: selectedConference,
      invitation_number: invNumber,
      issue_date: new Date().toISOString().split('T')[0],
      travel_date: travelDate,
      status: 'issued'
    }]).select()

    if (!error && data) {
      const conference = conferences.find(c => c.id === selectedConference)
      const pdf = await generateInvitationPDF(selectedDoctor, conference, data[0])
      pdf.download(`${invNumber}.pdf`)
      fetchInvitations()
      setSelectedDoctor(null)
      setSelectedConference('')
      setTravelDate('')
      alert('تم إصدار الدعوة بنجاح')
    }
  }

  const deleteInvitation = async (invitationId) => {
    if (confirm('هل أنت متأكد من حذف هذه الدعوة؟')) {
      await supabase.from('invitations').delete().eq('id', invitationId)
      fetchInvitations()
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Conference */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-600">المؤتمرات</h2>
          <button
            onClick={() => setShowNewConfForm(!showNewConfForm)}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            {showNewConfForm ? 'إلغاء' : 'مؤتمر جديد'}
          </button>
        </div>

        {showNewConfForm && (
          <form onSubmit={createConference} className="space-y-3 mb-6 bg-gray-50 p-4 rounded">
            <input
              type="text"
              placeholder="عنوان المؤتمر"
              value={newConf.title}
              onChange={(e) => setNewConf({...newConf, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="المكان"
              value={newConf.location}
              onChange={(e) => setNewConf({...newConf, location: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="date"
                placeholder="تاريخ البدء"
                value={newConf.start_date}
                onChange={(e) => setNewConf({...newConf, start_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="date"
                placeholder="تاريخ النهاية"
                value={newConf.end_date}
                onChange={(e) => setNewConf({...newConf, end_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="date"
                placeholder="آخر موعد تسجيل"
                value={newConf.registration_deadline}
                onChange={(e) => setNewConf({...newConf, registration_deadline: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              إنشاء مؤتمر
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conferences.map(conf => (
            <div key={conf.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-lg">{conf.title}</h3>
              <p className="text-sm text-gray-600">{conf.location}</p>
              <p className="text-sm text-gray-600">{conf.start_date} - {conf.end_date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Issue Invitation */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-teal-600 mb-6">إصدار دعوة</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">اختر الطبيب</label>
            <select
              onChange={(e) => {
                const doc = doctors.find(d => d.id === e.target.value)
                setSelectedDoctor(doc)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- اختر --</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} - {doc.specialty}
                </option>
              ))}
            </select>
          </div>

          {selectedDoctor && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">بيانات الطبيب:</h3>
              <p>الاسم: {selectedDoctor.full_name}</p>
              <p>الجواز: {selectedDoctor.passport_number}</p>
              <p>الجنسية: {selectedDoctor.nationality}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2">المؤتمر</label>
            <select
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- اختر --</option>
              {conferences.map(conf => (
                <option key={conf.id} value={conf.id}>
                  {conf.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">تاريخ السفر</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={issueInvitation}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
          >
            إصدار الدعوة
          </button>
        </div>
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-teal-600 mb-6">الدعوات الصادرة</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">الطبيب</th>
                <th className="text-right p-2">رقم الدعوة</th>
                <th className="text-right p-2">المؤتمر</th>
                <th className="text-right p-2">تاريخ الإصدار</th>
                <th className="text-right p-2">الحالة</th>
                <th className="text-right p-2">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map(inv => {
                const doc = doctors.find(d => d.id === inv.doctor_id)
                const conf = conferences.find(c => c.id === inv.conference_id)
                return (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{doc?.full_name}</td>
                    <td className="p-2">{inv.invitation_number}</td>
                    <td className="p-2">{conf?.title}</td>
                    <td className="p-2">{inv.issue_date}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        inv.status === 'issued' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status === 'issued' ? 'مُصدَّرة' : 'مسودة'}
                      </span>
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => deleteInvitation(inv.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctors Directory */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-teal-600 mb-6">الأطباء المسجلون</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right p-2">الاسم</th>
                <th className="text-right p-2">التخصص</th>
                <th className="text-right p-2">المستشفى</th>
                <th className="text-right p-2">الجواز</th>
                <th className="text-right p-2">الجنسية</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(doc => (
                <tr key={doc.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{doc.full_name}</td>
                  <td className="p-2">{doc.specialty}</td>
                  <td className="p-2">{doc.hospital}</td>
                  <td className="p-2">{doc.passport_number}</td>
                  <td className="p-2">{doc.nationality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
