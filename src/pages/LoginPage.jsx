import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export function LoginPage({ onSuccess, onSwitchPage }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-teal-600 mb-2">Fertility Global Research</h2>
          <p className="text-gray-600">تسجيل الدخول</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'جاري التسجيل...' : 'دخول'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          ليس لديك حساب؟{' '}
          <button
            onClick={onSwitchPage}
            className="text-teal-600 font-semibold hover:underline"
          >
            إنشاء حساب جديد
          </button>
        </p>
      </div>
    </div>
  )
}

export function RegisterPage({ onSuccess, onSwitchPage }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    specialty: '',
    hospital: '',
    passportNumber: '',
    nationality: '',
    yearsOfExperience: 0,
    fertilitySpecialist: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Create doctor profile
    const { error: profileError } = await supabase.from('doctors').insert([{
      user_id: authData.user.id,
      full_name: formData.fullName,
      specialty: formData.specialty,
      hospital: formData.hospital,
      email: formData.email,
      passport_number: formData.passportNumber,
      nationality: formData.nationality,
      years_of_experience: parseInt(formData.yearsOfExperience),
      fertility_specialist: formData.fertilitySpecialist
    }])

    if (profileError) {
      setError(profileError.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-teal-600 mb-2">تسجيل جديد</h2>
          <p className="text-gray-600">إنشاء حساب طبيب</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3 max-h-96 overflow-y-auto">
          <input
            type="email"
            name="email"
            placeholder="البريد الإلكتروني"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="كلمة المرور"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="fullName"
            placeholder="الاسم الكامل"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="specialty"
            placeholder="التخصص"
            value={formData.specialty}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="hospital"
            placeholder="المستشفى"
            value={formData.hospital}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="passportNumber"
            placeholder="رقم الجواز"
            value={formData.passportNumber}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="nationality"
            placeholder="الجنسية"
            value={formData.nationality}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="number"
            name="yearsOfExperience"
            placeholder="سنوات الخبرة"
            value={formData.yearsOfExperience}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              name="fertilitySpecialist"
              checked={formData.fertilitySpecialist}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-gray-700">متخصص في الخصوبة</span>
          </label>

          {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          هل لديك حساب؟{' '}
          <button onClick={onSwitchPage} className="text-teal-600 font-semibold hover:underline">
            دخول
          </button>
        </p>
      </div>
    </div>
  )
}

export default { LoginPage, RegisterPage }
