import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { generateInvitationPDF } from '../utils/pdfGenerator'

export default function DoctorDashboard({ doctor }) {
  const [profileData, setProfileData] = useState(doctor || {})
  const [documents, setDocuments] = useState([])
  const [conferences, setConferences] = useState([])
  const [invitations, setInvitations] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selectedConference, setSelectedConference] = useState('')

  useEffect(() => {
    fetchDocuments()
    fetchConferences()
    fetchInvitations()
  }, [doctor?.id])

  const fetchDocuments = async () => {
    if (!doctor?.id) return
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('doctor_id', doctor.id)
    setDocuments(data || [])
  }

  const fetchConferences = async () => {
    const { data } = await supabase.from('conferences').select('*')
    setConferences(data || [])
  }

  const fetchInvitations = async () => {
    if (!doctor?.id) return
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('doctor_id', doctor.id)
    setInvitations(data || [])
  }

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0]
    if (!file || !doctor?.id) return

    setUploading(true)
    const filePath = `${doctor.id}/${docType}-${Date.now()}`

    // Create storage bucket if needed
    const { data, error } = await supabase.storage
      .from('doctor-documents')
      .upload(filePath, file, { upsert: true })

    if (!error) {
      await supabase.from('documents').insert([{
        doctor_id: doctor.id,
        document_type: docType,
        file_url: filePath
      }])
      fetchDocuments()
    }
    setUploading(false)
  }

  const downloadInvitation = async (invitation) => {
    const conference = conferences.find(c => c.id === invitation.conference_id)
    const pdf = await generateInvitationPDF(doctor, conference, invitation)
    pdf.download(`invitation-${invitation.invitation_number}.pdf`)
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-teal-600 mb-6">ملفي الشخصي</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 font-semibold">الاسم الكامل</p>
            <p className="text-lg">{profileData.full_name}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">التخصص</p>
            <p className="text-lg">{profileData.specialty}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">المستشفى</p>
            <p className="text-lg">{profileData.hospital}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">رقم الجواز</p>
            <p className="text-lg">{profileData.passport_number}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">الجنسية</p>
            <p className="text-lg">{profileData.nationality}</p>
          </div>
          <div>
            <p className="text-gray-600 font-semibold">سنوات الخبرة</p>
            <p className="text-lg">{profileData.years_of_experience}</p>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-teal-600 mb-6">المستمسكات</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">الجواز</label>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, 'passport')}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">شهادة</label>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, 'certificate')}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">السيرة الذاتية</label>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, 'cv')}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {documents.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-3">المستمسكات المرفوعة:</h3>
            <ul className="space-y-2">
              {documents.map(doc => (
                <li key={doc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span>{doc.document_type}</span>
                  <a href={supabase.storage.from('doctor-documents').getPublicUrl(doc.file_url).data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                    عرض
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Invitations Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-teal-600 mb-6">دعواتي</h2>
        {invitations.length === 0 ? (
          <p className="text-gray-600">لا توجد دعوات حالياً</p>
        ) : (
          <div className="space-y-3">
            {invitations.map(inv => {
              const conf = conferences.find(c => c.id === inv.conference_id)
              return (
                <div key={inv.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{conf?.title}</p>
                    <p className="text-sm text-gray-600">رقم الدعوة: {inv.invitation_number}</p>
                    <p className="text-sm text-gray-600">الحالة: {inv.status === 'issued' ? 'مُصدَّرة' : 'مسودة'}</p>
                  </div>
                  {inv.status === 'issued' && (
                    <button
                      onClick={() => downloadInvitation(inv)}
                      className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                    >
                      تحميل الدعوة
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
