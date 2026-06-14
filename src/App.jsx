import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { LoginPage, RegisterPage } from './pages/LoginPage'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { DoctorDirectory, ConferencesPage, BlogPage } from './pages/AdditionalPages'
import AboutPage from './pages/AboutPage'
import NewsActivitiesPage from './pages/NewsActivitiesPage'
import HomePage from './pages/HomePage'
import './App.css'

const ADMIN_EMAILS = ['admin@fertility-global.org']

export default function App() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')
  const [doctor, setDoctor] = useState(null)
  const [authView, setAuthView] = useState(null)

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) {
        setIsAdmin(ADMIN_EMAILS.includes(u.email))
        fetchDoctorProfile(u.id)
      } else {
        setIsAdmin(false)
        setDoctor(null)
      }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const u = session?.user || null
    setUser(u)
    if (u) {
      setIsAdmin(ADMIN_EMAILS.includes(u.email))
      fetchDoctorProfile(u.id)
    }
    setLoading(false)
  }

  const fetchDoctorProfile = async (userId) => {
    const { data } = await supabase.from('doctors').select('*').eq('user_id', userId).single()
    if (data) setDoctor(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setDoctor(null)
    setAuthView(null)
    setCurrentPage('home')
  }

  const goTo = (page) => {
    setAuthView(null)
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/logo.png" alt="" className="loading-logo" />
        <div className="spinner"></div>
      </div>
    )
  }

  if (authView && !user) {
    return authView === 'login' ? (
      <LoginPage
        onSuccess={() => { setAuthView(null); setCurrentPage('dashboard') }}
        onSwitchPage={() => setAuthView('register')}
        onBack={() => setAuthView(null)}
      />
    ) : (
      <RegisterPage
        onSuccess={() => setAuthView('login')}
        onSwitchPage={() => setAuthView('login')}
        onBack={() => setAuthView(null)}
      />
    )
  }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="nav-inner">
          <button className="brand" onClick={() => goTo('home')}>
            <img src="/logo.png" alt="" className="brand-logo" />
            <span className="brand-name">Fertility Global Research</span>
          </button>

          <div className="nav-links">
            <button className={navCls(currentPage, 'home')} onClick={() => goTo('home')}>الرئيسية</button>
            <button className={navCls(currentPage, 'about')} onClick={() => goTo('about')}>عن الجمعية</button>
            <button className={navCls(currentPage, 'news')} onClick={() => goTo('news')}>النشاطات</button>
            <button className={navCls(currentPage, 'conferences')} onClick={() => goTo('conferences')}>المؤتمرات</button>
            <button className={navCls(currentPage, 'directory')} onClick={() => goTo('directory')}>دليل الأطباء</button>

            {user && !isAdmin && (
              <button className={navCls(currentPage, 'dashboard')} onClick={() => goTo('dashboard')}>ملفي</button>
            )}
            {user && isAdmin && (
              <button className={navCls(currentPage, 'admin')} onClick={() => goTo('admin')}>لوحة التحكم</button>
            )}

            {user ? (
              <button className="nav-cta" onClick={handleLogout}>خروج</button>
            ) : (
              <button className="nav-cta" onClick={() => setAuthView('login')}>دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main>
        {currentPage === 'home' && <HomePage onNavigate={goTo} onLogin={() => setAuthView('login')} />}
        {currentPage === 'about' && <div className="page-wrap"><AboutPage /></div>}
        {currentPage === 'news' && <div className="page-wrap"><NewsActivitiesPage isAdmin={isAdmin} /></div>}
        {currentPage === 'conferences' && <div className="page-wrap"><ConferencesPage isAdmin={isAdmin} /></div>}
        {currentPage === 'directory' && <div className="page-wrap"><DoctorDirectory /></div>}
        {currentPage === 'blog' && <div className="page-wrap"><BlogPage isAdmin={isAdmin} /></div>}
        {currentPage === 'dashboard' && user && !isAdmin && <div className="page-wrap"><DoctorDashboard doctor={doctor} /></div>}
        {currentPage === 'admin' && user && isAdmin && <div className="page-wrap"><AdminDashboard /></div>}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <img src="/logo.png" alt="" className="footer-logo" />
            <p className="footer-org">Fertility Global Research</p>
            <p className="footer-small">جمعية الخصوبة العالمية للبحث العلمي</p>
          </div>
          <div>
            <h4>تواصل</h4>
            <p>London, United Kingdom</p>
            <p>contact@fertility-global.org</p>
          </div>
          <div>
            <h4>روابط</h4>
            <button className="footer-link" onClick={() => goTo('about')}>عن الجمعية</button>
            <button className="footer-link" onClick={() => goTo('conferences')}>المؤتمرات</button>
            <button className="footer-link" onClick={() => goTo('news')}>النشاطات</button>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Fertility Global Research. جميع الحقوق محفوظة.</div>
      </footer>
    </div>
  )
}

function navCls(current, page) {
  return current === page ? 'nav-link active' : 'nav-link'
}
