import React from 'react'

export default function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg shadow-lg p-12">
        <h1 className="text-4xl font-bold mb-4">عن جمعية الخصوبة العالمية</h1>
        <h2 className="text-2xl font-semibold mb-6">About Fertility Global Research</h2>
        <p className="text-lg leading-relaxed max-w-3xl">
          جمعية متخصصة في البحث العلمي والتطوير الطبي في مجال الخصوبة وعلاج العقم. نعمل على تجميع أفضل الكفاءات الطبية من حول العالم لتبادل الخبرات والمعرفة.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mission */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              🎯
            </div>
            <h3 className="text-2xl font-bold text-teal-600 mr-4">مهمتنا</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">
            نسعى لتقديم أحدث الممارسات الطبية والبحثية في مجال الخصوبة، وتوفير منصة عالمية لتبادل المعرفة والخبرات بين الأطباء والمتخصصين.
          </p>
          <hr className="my-4" />
          <p className="text-gray-600 text-sm">
            <strong>Our Mission:</strong> To advance fertility science and provide a global platform for medical professionals to collaborate and share knowledge.
          </p>
        </div>

        {/* Vision */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              🌍
            </div>
            <h3 className="text-2xl font-bold text-blue-600 mr-4">رؤيتنا</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">
            أن نصبح الجمعية الرائدة عالمياً في تطوير أبحاث الخصوبة وتحسين جودة الخدمات الطبية في هذا المجال الحساس.
          </p>
          <hr className="my-4" />
          <p className="text-gray-600 text-sm">
            <strong>Our Vision:</strong> To be the global leader in fertility research and medical innovation, improving lives worldwide.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-3xl font-bold text-teal-600 mb-8 text-center">قيمنا الأساسية | Core Values</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Value 1 */}
          <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
            <div className="text-4xl mb-3">🏥</div>
            <h4 className="text-xl font-bold text-teal-600 mb-2">التميز الطبي</h4>
            <p className="text-gray-600 text-sm">
              نلتزم بأعلى معايير البحث العلمي والممارسات الطبية المثبتة عالمياً.
            </p>
            <hr className="my-3" />
            <h5 className="font-semibold text-gray-700 mb-1">Medical Excellence</h5>
            <p className="text-gray-600 text-sm">
              Commitment to the highest standards of medical practice and research.
            </p>
          </div>

          {/* Value 2 */}
          <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
            <div className="text-4xl mb-3">🤝</div>
            <h4 className="text-xl font-bold text-blue-600 mb-2">التعاون العالمي</h4>
            <p className="text-gray-600 text-sm">
              نؤمن بقوة التعاون بين الأطباء والمتخصصين من مختلف دول العالم.
            </p>
            <hr className="my-3" />
            <h5 className="font-semibold text-gray-700 mb-1">Global Collaboration</h5>
            <p className="text-gray-600 text-sm">
              Building bridges between healthcare professionals worldwide.
            </p>
          </div>

          {/* Value 3 */}
          <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
            <div className="text-4xl mb-3">❤️</div>
            <h4 className="text-xl font-bold text-red-600 mb-2">الرحمة والعطف</h4>
            <p className="text-gray-600 text-sm">
              نركز على احتياجات المرضى وتحسين جودة حياتهم ورفاهيتهم.
            </p>
            <hr className="my-3" />
            <h5 className="font-semibold text-gray-700 mb-1">Compassion & Care</h5>
            <p className="text-gray-600 text-sm">
              Prioritizing patient wellbeing and improving lives.
            </p>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-bold text-teal-600 mb-6">معلومات التواصل | Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-lg mb-3">مقرنا الرئيسي</h4>
            <p className="text-gray-700">
              <strong>المقر:</strong> لندن، المملكة المتحدة<br/>
              <strong>البريد الإلكتروني:</strong> contact@fertility-global.org<br/>
              <strong>الهاتف:</strong> +44 (0) 20 XXXX XXXX
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-3">Headquarters</h4>
            <p className="text-gray-700">
              <strong>Address:</strong> London, United Kingdom<br/>
              <strong>Email:</strong> contact@fertility-global.org<br/>
              <strong>Phone:</strong> +44 (0) 20 XXXX XXXX
            </p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-bold text-teal-600 mb-8 text-center">إنجازاتنا | Our Achievements</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-teal-600 mb-2">200+</div>
            <p className="text-gray-700 font-semibold">أطباء متخصصين</p>
            <p className="text-gray-500 text-sm">Specialist Doctors</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
            <p className="text-gray-700 font-semibold">مؤتمر سنوي</p>
            <p className="text-gray-500 text-sm">Annual Conferences</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
            <p className="text-gray-700 font-semibold">أبحاث منشورة</p>
            <p className="text-gray-500 text-sm">Published Research</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600 mb-2">30+</div>
            <p className="text-gray-700 font-semibold">دول مشاركة</p>
            <p className="text-gray-500 text-sm">Participating Countries</p>
          </div>
        </div>
      </div>
    </div>
  )
}
