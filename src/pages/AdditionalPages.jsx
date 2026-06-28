import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../i18n.jsx'

export function DoctorDirectory({ profession = 'doctor' }) {
  const { t } = useLang()
  const [people, setPeople] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')

  useEffect(() => { fetchPeople() }, [profession])

  const fetchPeople = async () => {
    let query = supabase.from('doctors').select('*')
    const { data } = await query
    // filter by profession (older records may have null profession => treat as doctor)
    const list = (data || []).filter(d => (d.profession || 'doctor') === profession)
    setPeople(list)
  }

  const specialties = [...new Set(people.map(d => d.specialty).filter(Boolean))]
  const filtered = people.filter(d => {
    const s = searchTerm.trim()
    const matchSearch = !s || (d.full_name || '').includes(s)
    const matchSpec = !specialtyFilter || d.specialty === specialtyFilter
    return matchSearch && matchSpec
  })

  const title = profession === 'pharmacist' ? t('dir_pharmacists')
    : profession === 'medical' ? t('dir_medical') : t('dir_doctors')

  return (
    <div>
      <h1>{title}</h1>
      <div className="filter-bar" style={{ marginBottom: '1.2rem' }}>
        <input className="auth-input" placeholder={t('nav_directory') + ' ...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select className="auth-input" value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)}>
          <option value="">—</option>
          {specialties.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card-grid">
        {filtered.map(d => (
          <div className="event-card" key={d.id}>
            <h3>{d.full_name}</h3>
            <p className="muted">{d.specialty}</p>
            <p className="muted">🏥 {d.hospital}</p>
            <p className="muted">🌍 {d.nationality}</p>
            {(d.city || d.governorate) && (
              <p className="muted">📍 {[d.city, d.governorate].filter(Boolean).join(', ')}</p>
            )}
            {d.fertility_specialist && <span className="news-cat" style={{ marginTop: '.5rem', display: 'inline-block' }}>{t('reg_fertility')}</span>}
          </div>
        ))}
        {filtered.length === 0 && <p className="muted">—</p>}
      </div>
    </div>
  )
}

export function ConferencesPage({ isAdmin }) {
  const [conferences, setConferences] = useState([])

  useEffect(() => {
    fetchConferences()
  }, [])

  const fetchConferences = async () => {
    const { data } = await supabase.from('conferences').select('*')
    setConferences(data || [])
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-teal-600 mb-6">المؤتمرات</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conferences.map(conf => (
            <div key={conf.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="font-bold text-xl text-teal-600 mb-3">{conf.title}</h3>
              <p className="text-gray-700 mb-4">{conf.description}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>📍 المكان:</strong> {conf.location}</p>
                <p><strong>📅 التاريخ:</strong> {conf.start_date} إلى {conf.end_date}</p>
                <p><strong>⏰ آخر موعد تسجيل:</strong> {conf.registration_deadline}</p>
              </div>
            </div>
          ))}
        </div>

        {conferences.length === 0 && (
          <p className="text-center text-gray-600 py-8">لا توجد مؤتمرات حالياً</p>
        )}
      </div>
    </div>
  )
}

export function BlogPage({ isAdmin }) {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState({ title: '', content: '', excerpt: '' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const createPost = async (e) => {
    e.preventDefault()
    const slug = newPost.title.toLowerCase().replace(/\s+/g, '-')
    const { error } = await supabase.from('blog_posts').insert([{
      ...newPost,
      slug,
      published: true,
      author: 'Global Fertility Research'
    }])
    
    if (!error) {
      setNewPost({ title: '', content: '', excerpt: '' })
      setShowForm(false)
      fetchPosts()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-teal-600">المدونة</h2>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              {showForm ? 'إلغاء' : 'مقالة جديدة'}
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <form onSubmit={createPost} className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg">
            <input
              type="text"
              placeholder="عنوان المقالة"
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <textarea
              placeholder="الملخص"
              value={newPost.excerpt}
              onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="2"
              required
            />
            <textarea
              placeholder="المحتوى"
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="6"
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            >
              نشر المقالة
            </button>
          </form>
        )}

        <div className="space-y-6">
          {posts.map(post => (
            <article key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-teal-600 mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-3">{post.excerpt}</p>
              <p className="text-sm text-gray-500">بقلم: {post.author}</p>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="text-center text-gray-600 py-8">لا توجد مقالات حالياً</p>
        )}
      </div>
    </div>
  )
}

export default { DoctorDirectory, ConferencesPage, BlogPage }
