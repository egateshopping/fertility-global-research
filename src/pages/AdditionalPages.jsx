import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function DoctorDirectory() {
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [specialties, setSpecialties] = useState([])

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*')
    setDoctors(data || [])
    setFilteredDoctors(data || [])
    
    // Extract unique specialties
    const specs = [...new Set(data?.map(d => d.specialty) || [])]
    setSpecialties(specs)
  }

  useEffect(() => {
    let filtered = doctors
    
    if (searchTerm) {
      filtered = filtered.filter(d => d.full_name.includes(searchTerm))
    }
    
    if (specialtyFilter) {
      filtered = filtered.filter(d => d.specialty === specialtyFilter)
    }
    
    setFilteredDoctors(filtered)
  }, [searchTerm, specialtyFilter, doctors])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-teal-600 mb-6">دليل الأطباء</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            placeholder="ابحث عن طبيب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
          />
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="">جميع التخصصات</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
              <h3 className="font-bold text-lg text-teal-600 mb-2">{doc.full_name}</h3>
              <p className="text-sm text-gray-600 mb-1"><strong>التخصص:</strong> {doc.specialty}</p>
              <p className="text-sm text-gray-600 mb-1"><strong>المستشفى:</strong> {doc.hospital}</p>
              <p className="text-sm text-gray-600 mb-1"><strong>الجنسية:</strong> {doc.nationality}</p>
              <p className="text-sm text-gray-600"><strong>سنوات الخبرة:</strong> {doc.years_of_experience}</p>
              {doc.fertility_specialist && (
                <span className="inline-block mt-3 px-2 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded">
                  متخصص في الخصوبة
                </span>
              )}
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <p className="text-center text-gray-600 py-8">لم يتم العثور على أطباء</p>
        )}
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
      author: 'Fertility Global Research'
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
