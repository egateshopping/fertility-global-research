import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function HomePage({ onNavigate, onLogin }) {
  const [conferences, setConferences] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: confs } = await supabase
      .from('conferences')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(3)
    setConferences(confs || [])

    const { data: acts } = await supabase
      .from('activities')
      .select('*')
      .order('activity_date', { ascending: false })
      .limit(3)
    setActivities(acts || [])
  }

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-inner">
          <img src="/logo.png" alt="Fertility Global Research" className="hero-logo" />
          <h1 className="hero-title">Fertility Global Research</h1>
          <p className="hero-sub-ar">جمعية الخصوبة العالمية للبحث العلمي</p>
          <p className="hero-tag">Advancing Fertility Science Worldwide · تقدم علوم الخصوبة عالمياً</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => onNavigate('about')}>
              تعرّف على الجمعية
            </button>
            <button className="btn-outline" onClick={onLogin}>
              تسجيل دخول الأطباء
            </button>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="band">
        <div className="container">
          <span className="eyebrow">من نحن · About</span>
          <h2 className="band-title">منصة عالمية لتطوير أبحاث الخصوبة</h2>
          <p className="band-text">
            جمعية بريطانية متخصصة في البحث العلمي والتطوير الطبي في مجال الخصوبة وعلاج العقم.
            نجمع نخبة الأطباء والباحثين من حول العالم لتبادل الخبرات، وتنظيم المؤتمرات،
            والاطلاع على أحدث المستجدات الطبية.
          </p>
          <p className="band-text-en">
            A UK-based organization dedicated to fertility research and medical advancement,
            connecting specialists worldwide through conferences, training, and shared knowledge.
          </p>
          <button className="link-btn" onClick={() => onNavigate('about')}>اعرف المزيد ←</button>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="container section-pad">
        <span className="eyebrow">الأحداث القادمة · Upcoming Events</span>
        <h2 className="section-title">المؤتمرات والفعاليات</h2>
        {conferences.length === 0 ? (
          <p className="muted">سيتم الإعلان عن المؤتمرات القادمة قريباً.</p>
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
        <button className="link-btn" onClick={() => onNavigate('conferences')}>كل المؤتمرات ←</button>
      </section>

      {/* ACTIVITIES */}
      <section className="band">
        <div className="container">
          <span className="eyebrow">النشاطات والأخبار · News</span>
          <h2 className="band-title">آخر المستجدات</h2>
          {activities.length === 0 ? (
            <p className="muted">لا توجد نشاطات منشورة بعد.</p>
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
          <button className="link-btn" onClick={() => onNavigate('news')}>كل النشاطات ←</button>
        </div>
      </section>

      {/* WHY JOIN */}
      <section className="container section-pad">
        <span className="eyebrow">لماذا الانضمام · Why Join</span>
        <h2 className="section-title">مزايا العضوية</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">🎓</div>
            <h3>شهادات التطوير المهني</h3>
            <p>حضور مؤتمرات معتمدة للتطوير المهني المستمر (CPD).</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🌍</div>
            <h3>شبكة عالمية</h3>
            <p>تواصل مع أطباء ومتخصصين من أكثر من 30 دولة.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🔬</div>
            <h3>أحدث الأبحاث</h3>
            <p>اطّلاع مباشر على آخر المستجدات في علوم الخصوبة.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">📨</div>
            <h3>دعوات رسمية</h3>
            <p>إصدار دعوات حضور موثّقة للمؤتمرات الدولية.</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-band">
        <div className="container stats-row">
          <div className="stat-item"><span className="stat-num">200+</span><span className="stat-lbl">طبيب متخصص</span></div>
          <div className="stat-item"><span className="stat-num">50+</span><span className="stat-lbl">مؤتمر</span></div>
          <div className="stat-item"><span className="stat-num">30+</span><span className="stat-lbl">دولة</span></div>
          <div className="stat-item"><span className="stat-num">100+</span><span className="stat-lbl">بحث منشور</span></div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="container">
          <h2>انضم إلى مجتمع الأطباء العالمي</h2>
          <p>سجّل حسابك المجاني وابدأ رحلتك مع الجمعية.</p>
          <button className="btn-primary" onClick={onLogin}>إنشاء حساب طبيب</button>
        </div>
      </section>
    </div>
  )
}
