import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function NewsActivitiesPage({ isAdmin }) {
  const [activities, setActivities] = useState([])
  const [showNewActivityForm, setShowNewActivityForm] = useState(false)
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    activity_date: '',
    category: 'news', // 'news', 'event', 'announcement'
    image_url: ''
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .order('activity_date', { ascending: false })
    setActivities(data || [])
  }

  const createActivity = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('activities').insert([newActivity])
    
    if (!error) {
      setNewActivity({
        title: '',
        description: '',
        activity_date: '',
        category: 'news',
        image_url: ''
      })
      setShowNewActivityForm(false)
      fetchActivities()
      alert('تم إضافة النشاط بنجاح!')
    } else {
      alert('حدث خطأ: ' + error.message)
    }
  }

  const deleteActivity = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا النشاط؟')) {
      await supabase.from('activities').delete().eq('id', id)
      fetchActivities()
    }
  }

  const getCategoryColor = (category) => {
    switch(category) {
      case 'news': return 'bg-blue-100 text-blue-800'
      case 'event': return 'bg-green-100 text-green-800'
      case 'announcement': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'news': return '📰'
      case 'event': return '📅'
      case 'announcement': return '📢'
      default: return '📌'
    }
  }

  const getCategoryLabel = (category) => {
    switch(category) {
      case 'news': return 'أخبار | News'
      case 'event': return 'حدث | Event'
      case 'announcement': return 'إعلان | Announcement'
      default: return 'نشاط | Activity'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg shadow-lg p-12">
        <h1 className="text-4xl font-bold mb-2">الأخبار والنشاطات</h1>
        <h2 className="text-2xl font-semibold">News & Activities</h2>
        <p className="text-teal-100 mt-4">تابع آخر أخبار وفعاليات الجمعية | Stay updated with our latest news and events</p>
      </div>

      {/* Add Activity Form (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-teal-600">إضافة نشاط جديد</h3>
            <button
              onClick={() => setShowNewActivityForm(!showNewActivityForm)}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              {showNewActivityForm ? 'إلغاء' : '➕ نشاط جديد'}
            </button>
          </div>

          {showNewActivityForm && (
            <form onSubmit={createActivity} className="space-y-4 bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">العنوان</label>
                  <input
                    type="text"
                    placeholder="عنوان النشاط"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">التاريخ</label>
                  <input
                    type="date"
                    value={newActivity.activity_date}
                    onChange={(e) => setNewActivity({...newActivity, activity_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">النوع</label>
                <select
                  value={newActivity.category}
                  onChange={(e) => setNewActivity({...newActivity, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="news">أخبار</option>
                  <option value="event">حدث</option>
                  <option value="announcement">إعلان</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">الصورة (رابط)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newActivity.image_url}
                  onChange={(e) => setNewActivity({...newActivity, image_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">الوصف</label>
                <textarea
                  placeholder="وصف مفصل للنشاط..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="5"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
              >
                إضافة النشاط
              </button>
            </form>
          )}
        </div>
      )}

      {/* Activities Feed */}
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">لا توجد نشاطات حالياً | No activities yet</p>
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="md:flex">
                {/* Image */}
                {activity.image_url && (
                  <div className="md:w-1/3 h-64 md:h-auto bg-gray-200 overflow-hidden">
                    <img
                      src={activity.image_url}
                      alt={activity.title}
                      className="w-full h-full object-cover hover:scale-105 transition"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className={`p-6 ${activity.image_url ? 'md:w-2/3' : 'w-full'}`}>
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(activity.category)}`}>
                      {getCategoryIcon(activity.category)} {getCategoryLabel(activity.category)}
                    </span>
                    <span className="text-gray-500 text-sm">📅 {activity.activity_date}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-teal-600 mb-3">{activity.title}</h3>

                  {/* Description */}
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {activity.description.substring(0, 300)}
                    {activity.description.length > 300 ? '...' : ''}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <button className="px-4 py-2 text-teal-600 hover:bg-teal-50 rounded transition">
                      اقرأ المزيد →
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-bold text-teal-600 mb-6 text-center">إحصائيات النشاطات</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">
              {activities.filter(a => a.category === 'news').length}
            </div>
            <p className="text-gray-700 font-semibold">أخبار | News</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {activities.filter(a => a.category === 'event').length}
            </div>
            <p className="text-gray-700 font-semibold">أحداث | Events</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {activities.filter(a => a.category === 'announcement').length}
            </div>
            <p className="text-gray-700 font-semibold">إعلانات | Announcements</p>
          </div>
        </div>
      </div>

      {/* Subscribe Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg shadow-lg p-12 text-center">
        <h3 className="text-3xl font-bold mb-4">اشترك في النشرة البريدية</h3>
        <p className="text-teal-100 mb-6">تابع جديد أخبارنا مباشرة على بريدك الإلكتروني</p>
        
        <div className="max-w-md mx-auto flex gap-2">
          <input
            type="email"
            placeholder="بريدك الإلكتروني"
            className="flex-1 px-4 py-3 rounded text-gray-800 focus:outline-none"
          />
          <button className="px-6 py-3 bg-white text-teal-600 font-bold rounded hover:bg-gray-100 transition">
            اشترك
          </button>
        </div>
      </div>
    </div>
  )
}
