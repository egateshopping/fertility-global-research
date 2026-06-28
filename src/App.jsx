import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { LoginPage, RegisterPage } from './pages/LoginPage'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { DoctorDirectory, ConferencesPage, BlogPage } from './pages/AdditionalPages'
import AboutPage from './pages/AboutPage'
import NewsActivitiesPage from './pages/NewsActivitiesPage'
import HomePage from './pages/HomePage'
import ReportPage from './pages/ReportPage'
import TermsPage from './pages/TermsPage'
import VerifyPage from './pages/VerifyPage'
import CertVerifyPage from './pages/CertVerifyPage'
import { useLang } from './i18n.jsx'
import './App.css'

const ADMIN_EMAILS = ['egate.shopping@gmail.com']
const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/FertilityGlobalResearch',
  linkedin: 'https://linkedin.com/company/global-fertility-research-research',
  twitter: 'https://twitter.com/FGResearch',
  instagram: 'https://instagram.com/fertilityglobalresearch',
  whatsapp: 'https://wa.me/447512028322'
}

export default function App() {
  const { t, lang, toggle } = useLang()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')
  const [doctor, setDoctor] = useState(null)
  const [authView, setAuthView] = useState(null)
  const [recovery, setRecovery] = useState(false)
  // Check for verify URL on load
  const verifyMatch = window.location.pathname.match(/\/verify\/([A-Z0-9-]+)/)
  const certVerifyMatch = window.location.pathname.match(/\/verify\/cert\/([A-Z0-9-]+)/)
  const [verifyNum] = useState(verifyMatch ? verifyMatch[1] : null)

  // Handle internal navigation events (e.g. from terms link in register)
  useEffect(() => {
    const handler = (e) => goTo(e.detail)
    window.addEventListener('goto', handler)
    return () => window.removeEventListener('goto', handler)
  }, [])

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
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
    if (data) {
      setDoctor(data)
      // Grant admin if root email OR if is_admin flag set in DB
      if (data.is_admin) setIsAdmin(true)
    }
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

  // Auto-refresh for pending doctors every 30 seconds
  useEffect(() => {
    if (!user || !doctor || doctor.status !== 'pending' || isAdmin) return
    const interval = setInterval(async () => {
      const { data } = await supabase.from('doctors').select('status').eq('user_id', user.id).single()
      if (data?.status === 'approved') window.location.reload()
    }, 30000)
    return () => clearInterval(interval)
  }, [user, doctor, isAdmin])
  if (user && doctor && doctor.status === 'pending' && !isAdmin) {
    return (
      <div className="auth-screen">
        <div className="auth-card center">
          <img src="/logo.png" alt="" className="auth-logo" />
          <h2 className="auth-title">Application Under Review</h2>
          <p className="auth-sub">Your membership application is being reviewed by the association. You will be notified once approved.</p>
          <div className="auth-ok" style={{marginTop:'1rem'}}>⏳ Pending Approval</div>
          <p className="muted" style={{fontSize:'.82rem', marginTop:'.8rem'}}>
            This page refreshes automatically every 30 seconds.
          </p>
          <div style={{display:'flex', flexDirection:'column', gap:'.8rem', marginTop:'1.5rem', width:'100%'}}>
            <button className="btn-primary" onClick={async () => {
              // Refresh doctor status from DB
              const { data } = await supabase.from('doctors').select('*').eq('user_id', user.id).single()
              if (data) {
                if (data.status === 'approved') {
                  window.location.reload()
                } else {
                  alert('Your application is still under review.')
                }
              }
            }}>🔄 Check Status</button>
            <button className="auth-back" onClick={() => {
              supabase.auth.signOut().then(() => {
                window.location.href = '/'
              })
            }}>← Back to main website</button>
          </div>
        </div>
      </div>
    )
  }

  // Public cert verify page
  if (certVerifyMatch) {
    const certNum = certVerifyMatch[1]
    return (
      <div className="page-wrap" style={{ maxWidth: 700, margin: '0 auto', padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="" style={{ width: 80 }} />
        </div>
        <CertVerifyPage certNumber={certNum} />
      </div>
    )
  }

  // Public invitation verify page - no auth needed
  if (verifyNum) {
    return (
      <div className="page-wrap" style={{ maxWidth: 700, margin: '0 auto', padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="" style={{ width: 80 }} />
        </div>
        <VerifyPage invNumber={verifyNum} />
      </div>
    )
  }

  if (recovery) {
    return <UpdatePasswordScreen onDone={() => { setRecovery(false); setCurrentPage('home') }} />
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
            <span className="brand-name">Global Fertility Research</span>
          </button>

          <div className="nav-links">
            <button className={navCls(currentPage, 'home')} onClick={() => goTo('home')}>{t('nav_home')}</button>
            <button className={navCls(currentPage, 'about')} onClick={() => goTo('about')}>{t('nav_about')}</button>
            <button className={navCls(currentPage, 'news')} onClick={() => goTo('news')}>{t('nav_news')}</button>
            <button className={navCls(currentPage, 'conferences')} onClick={() => goTo('conferences')}>{t('nav_conferences')}</button>
            <button className={navCls(currentPage, 'dir_doctors')} onClick={() => goTo('dir_doctors')}>{t('dir_doctors')}</button>
            <button className={navCls(currentPage, 'dir_pharmacists')} onClick={() => goTo('dir_pharmacists')}>{t('dir_pharmacists')}</button>
            <button className={navCls(currentPage, 'dir_medical')} onClick={() => goTo('dir_medical')}>{t('dir_medical')}</button>

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
        {currentPage === 'dir_doctors' && <div className="page-wrap"><DoctorDirectory profession="doctor" /></div>}
        {currentPage === 'dir_pharmacists' && <div className="page-wrap"><DoctorDirectory profession="pharmacist" /></div>}
        {currentPage === 'dir_medical' && <div className="page-wrap"><DoctorDirectory profession="medical" /></div>}
        {currentPage === 'report' && <div className="page-wrap"><ReportPage /></div>}
        {currentPage === 'terms' && <div className="page-wrap"><TermsPage /></div>}
        {currentPage === 'verify' && <div className="page-wrap"><VerifyPage invNumber={verifyNum} /></div>}
        {currentPage === 'blog' && <div className="page-wrap"><BlogPage isAdmin={isAdmin} /></div>}
        {currentPage === 'dashboard' && user && !isAdmin && doctor && <div className="page-wrap"><DoctorDashboard doctor={doctor} /></div>}
        {currentPage === 'dashboard' && user && !isAdmin && !doctor && (
          <div className="auth-screen">
            <div className="auth-card center">
              <img src="/logo.png" alt="" className="auth-logo" />
              <h2 className="auth-title">Profile Not Found</h2>
              <p className="auth-sub">Your account exists but your profile was not found in our system. Please contact the association administrator.</p>
              <p className="muted" style={{fontSize:'.85rem',marginTop:'.5rem'}}>{user.email}</p>
              <button className="auth-back" style={{marginTop:'1.5rem'}} onClick={handleLogout}>Sign Out</button>
            </div>
          </div>
        )}
        {currentPage === 'admin' && user && isAdmin && <div className="page-wrap"><AdminDashboard /></div>}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <img src="/logo.png" alt="" className="footer-logo" />
            <p className="footer-org">Global Fertility Research</p>
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
            <button className="footer-link" onClick={() => goTo('report')}>{t('report_btn')}</button>
            <button className="footer-link" onClick={() => goTo('terms')}>Terms & Conditions</button>
          </div>
        </div>
        <div className="footer-social">
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="social-link">Facebook</a>
          <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn</a>
          <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="social-link">X / Twitter</a>
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="social-link">Instagram</a>
          <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="social-link">WhatsApp</a>
        </div>
        <div className="footer-bottom">{t('foot_rights')}</div>
      </footer>
    </div>
  )
}

function navCls(current, page) {
  return current === page ? 'nav-link active' : 'nav-link'
}

function UpdatePasswordScreen({ onDone }) {
  const { t } = useLang()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setErr('')
    if (pw !== pw2) { setErr(t('auth_password_mismatch')); return }
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setErr(error.message)
    else { setOk(true); setTimeout(onDone, 1500) }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/logo.png" alt="" className="auth-logo" />
        <h2 className="auth-title">{t('auth_reset_title')}</h2>
        {ok ? <div className="auth-ok">✓</div> : (
          <form onSubmit={save} className="auth-form">
            <input className="auth-input" type="password" placeholder={t('auth_password')} value={pw} onChange={e => setPw(e.target.value)} required />
            <input className="auth-input" type="password" placeholder={t('auth_password_confirm')} value={pw2} onChange={e => setPw2(e.target.value)} required />
            {err && <div className="auth-error">{err}</div>}
            <button className="btn-primary full" type="submit">{t('reg_create_btn')}</button>
          </form>
        )}
      </div>
    </div>
  )
}
