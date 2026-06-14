import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { LoginPage, RegisterPage } from './pages/LoginPage'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { DoctorDirectory, ConferencesPage, BlogPage } from './pages/AdditionalPages'
import AboutPage from './pages/AboutPage'
import NewsActivitiesPage from './pages/NewsActivitiesPage'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('login')
  const [doctor, setDoctor] = useState(null)

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user)
        if (session?.user) {
          checkAdminStatus(session.user.id)
          fetchDoctorProfile(session.user.id)
        }
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user)
    if (session?.user) {
      checkAdminStatus(session.user.id)
      fetchDoctorProfile(session.user.id)
    }
    setLoading(false)
  }

  const checkAdminStatus = async (userId) => {
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', userId)
      .single()

    setIsAdmin(data?.email?.includes('admin') || false)
  }

  const fetchDoctorProfile = async (userId) => {
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) setDoctor(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setDoctor(null)
    setCurrentPage('login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {currentPage === 'login' ? (
          <LoginPage onSuccess={() => setCurrentPage('dashboard')} onSwitchPage={() => setCurrentPage('register')} />
        ) : (
          <RegisterPage onSuccess={() => setCurrentPage('login')} onSwitchPage={() => setCurrentPage('login')} />
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-teal-600">Fertility Global Research</h1>
              <button
                onClick={() => setCurrentPage('about')}
                className={`px-4 py-2 rounded ${currentPage === 'about' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:text-teal-600'}`}
              >
                عن الجمعية
              </button>
              <button
                onClick={() => setCurrentPage('news')}
                className={`px-4 py-2 rounded ${currentPage === 'news' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:text-teal-600'}`}
              >
                الأخبار
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => setCurrentPage('admin')}
                    className={`px-4 py-2 rounded ${currentPage === 'admin' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:text-teal-600'}`}
                  >
                    لوحة التحكم
                  </button>
                </>
              )}
              {!isAdmin && (
                <>
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`px-4 py-2 rounded ${currentPage === 'dashboard' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:text-teal-600'}`}
                  >
                    ملفي الشخصي
                  </button>
                  <button
                    onClick={() => setCurrentPage('directory')}
                    className={`px-4 py-2 rounded ${currentPage === 'directory' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:text-teal-600'}`}
                  >
                    دليل الأطباء
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage('conferences')}
                className={`px-4 py-2 rounded ${currentPage === 'conferences' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:text-teal-600'}`}
              >
                المؤتمرات
              </button>
              <button
                onClick={() => setCurrentPage('blog')}
                className={`px-4 py-2 rounded ${currentPage === 'blog' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:text-teal-600'}`}
              >
                المدونة
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'news' && <NewsActivitiesPage isAdmin={isAdmin} />}
        {currentPage === 'dashboard' && !isAdmin && <DoctorDashboard doctor={doctor} />}
        {currentPage === 'admin' && isAdmin && <AdminDashboard />}
        {currentPage === 'directory' && <DoctorDirectory />}
        {currentPage === 'conferences' && <ConferencesPage isAdmin={isAdmin} />}
        {currentPage === 'blog' && <BlogPage isAdmin={isAdmin} />}
      </main>
    </div>
  )
}
