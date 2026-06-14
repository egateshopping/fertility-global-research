import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { LoginPage, RegisterPage } from './pages/LoginPage'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { DoctorDirectory, ConferencesPage, BlogPage } from './pages/AdditionalPages'
import AboutPage from './pages/AboutPage'
import NewsActivitiesPage from './pages/NewsActivitiesPage'
import HomePage from './pages/HomePage'
import { useLang } from './i18n.jsx'
import './App.css'

const ADMIN_EMAILS = ['egate.shopping@gmail.com']

export default function App() {
  const { t, lang, toggle } = useLang()
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
        setIsAdmin(ADMIN_EMAILS.includes((u.email || "").toLowerCase()))
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
      setIsAdmin(ADMIN_EMAILS.includes((u.email || "").toLowerCase()))
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
            <button className={navCls(currentPage, 'home')} onClick={() => goTo('home')}>{t('nav_home')}</button>
            <button className={navCls(currentPage, 'about')} onClick={() => goTo('about')}>{t('nav_about')}</button>
            <button className={navCls(currentPage, 'news')} onClick={() => goTo('news')}>{t('nav_news')}</button>
            <button className={navCls(currentPage, 'conferences')} onClick={() => goTo('conferences')}>{t('nav_conferences')}</button>
            <button className={navCls(currentPage, 'directory')} onClick={() => goTo('directory')}>{t('nav_directory')}</button>

            {user && !isAdmin && (
              <button className={navCls(currentPage, 'dashboard')} onClick={() => goTo('dashboard')}>{t('nav_profile')}</button>
            )}
            {user && isAdmin && (
              <button className={navCls(currentPage, 'admin')} onClick={() => goTo('admin')}>{t('nav_admin')}</button>
            )}

            <button className="lang-toggle" onClick={toggle}>{lang === 'ar' ? 'EN' : 'ع'}</button>

            {user ? (
              <button className="nav-cta" onClick={handleLogout}>{t('nav_logout')}</button>
            ) : (
              <button className="nav-cta" onClick={() => setAuthView('login')}>{t('nav_login')}</button>
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
            <p className="footer-small">{t('hero_sub')}</p>
          </div>
          <div>
            <h4>{t('foot_contact')}</h4>
            <p>London, United Kingdom</p>
            <p>contact@fertility-global.org</p>
          </div>
          <div>
            <h4>{t('foot_links')}</h4>
            <button className="footer-link" onClick={() => goTo('about')}>{t('nav_about')}</button>
            <button className="footer-link" onClick={() => goTo('conferences')}>{t('nav_conferences')}</button>
            <button className="footer-link" onClick={() => goTo('news')}>{t('nav_news')}</button>
          </div>
        </div>
        <div className="footer-bottom">{t('foot_rights')}</div>
      </footer>
    </div>
  )
}

function navCls(current, page) {
  return current === page ? 'nav-link active' : 'nav-link'
}
