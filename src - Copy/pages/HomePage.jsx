import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../i18n.jsx'

export default function HomePage({ onNavigate, onLogin }) {
  const { t } = useLang()
  const [conferences, setConferences] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: confs } = await supabase
      .from('conferences').select('*')
      .order('start_date', { ascending: true }).limit(3)
    setConferences(confs || [])
    const { data: acts } = await supabase
      .from('activities').select('*')
      .order('activity_date', { ascending: false }).limit(3)
    setActivities(acts || [])
  }

  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-inner">
          <img src="/logo.png" alt="Global Fertility Research" className="hero-logo" />
          <h1 className="hero-title">{t('hero_brand')}</h1>
          <p className="hero-sub-ar">{t('hero_sub')}</p>
          <p className="hero-tag">{t('hero_tag')}</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onNavigate('about')}>{t('hero_cta_about')}</button>
            <button className="btn-outline" onClick={onLogin}>{t('hero_cta_login')}</button>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="container">
          <span className="eyebrow">{t('intro_eyebrow')}</span>
          <h2 className="band-title">{t('intro_title')}</h2>
          <p className="band-text">{t('intro_text')}</p>
          <button className="link-btn" onClick={() => onNavigate('about')}>{t('learn_more')}</button>
        </div>
      </section>

      <section className="container section-pad">
        <span className="eyebrow">{t('events_eyebrow')}</span>
        <h2 className="section-title">{t('events_title')}</h2>
        {conferences.length === 0 ? (
          <p className="muted">{t('events_empty')}</p>
        ) : (
          <div className="card-grid">
            {conferences.map(c => (
              <div className="event-card" key={c.id}>
                <div className="event-date-tag">{c.start_date}</div>
                <h3>{c.title}</h3>
                <p className="event-loc">📍 {c.location}</p>
                <p className="event-desc">{c.description}</p>
              </div>
            ))}
          </div>
        )}
        <button className="link-btn" onClick={() => onNavigate('conferences')}>{t('events_all')}</button>
      </section>

      <section className="band">
        <div className="container">
          <span className="eyebrow">{t('news_eyebrow')}</span>
          <h2 className="band-title">{t('news_title')}</h2>
          {activities.length === 0 ? (
            <p className="muted">{t('news_empty')}</p>
          ) : (
            <div className="card-grid">
              {activities.map(a => (
                <div className="news-card-home" key={a.id}>
                  {a.image_url && <img src={a.image_url} alt={a.title} className="news-img" />}
                  <div className="news-body">
                    <span className="news-cat">{a.category}</span>
                    <h3>{a.title}</h3>
                    <p className="news-date">{a.activity_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="link-btn" onClick={() => onNavigate('news')}>{t('news_all')}</button>
        </div>
      </section>

      <section className="container section-pad">
        <span className="eyebrow">{t('why_eyebrow')}</span>
        <h2 className="section-title">{t('why_title')}</h2>
        <div className="why-grid">
          <div className="why-card"><div className="why-icon">🎓</div><h3>{t('why_1_t')}</h3><p>{t('why_1_d')}</p></div>
          <div className="why-card"><div className="why-icon">🌍</div><h3>{t('why_2_t')}</h3><p>{t('why_2_d')}</p></div>
          <div className="why-card"><div className="why-icon">🔬</div><h3>{t('why_3_t')}</h3><p>{t('why_3_d')}</p></div>
          <div className="why-card"><div className="why-icon">📨</div><h3>{t('why_4_t')}</h3><p>{t('why_4_d')}</p></div>
        </div>
      </section>

      <section className="stats-band">
        <div className="container stats-row">
          <div className="stat-item"><span className="stat-num">200+</span><span className="stat-lbl">{t('stat_doctors')}</span></div>
          <div className="stat-item"><span className="stat-num">50+</span><span className="stat-lbl">{t('stat_confs')}</span></div>
          <div className="stat-item"><span className="stat-num">30+</span><span className="stat-lbl">{t('stat_countries')}</span></div>
          <div className="stat-item"><span className="stat-num">100+</span><span className="stat-lbl">{t('stat_research')}</span></div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>{t('cta_title')}</h2>
          <p>{t('cta_text')}</p>
          <button className="btn-primary" onClick={onLogin}>{t('cta_btn')}</button>
        </div>
      </section>
    </div>
  )
}
