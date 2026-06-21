import React, { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  ar: {
    dir: 'rtl',
    brand: 'Fertility Global Research',
    // nav
    nav_home: 'الرئيسية',
    nav_about: 'عن الجمعية',
    nav_news: 'النشاطات',
    nav_conferences: 'المؤتمرات',
    nav_directory: 'دليل الأطباء',
    nav_profile: 'ملفي',
    nav_admin: 'لوحة التحكم',
    nav_login: 'دخول',
    nav_logout: 'خروج',
    // hero
    hero_sub: 'جمعية الخصوبة العالمية للبحث العلمي',
    hero_tag: 'تقدم علوم الخصوبة عالمياً',
    hero_cta_about: 'تعرّف على الجمعية',
    hero_cta_login: 'تسجيل دخول الأطباء',
    // intro
    intro_eyebrow: 'من نحن',
    intro_title: 'منصة عالمية لتطوير أبحاث الخصوبة',
    intro_text: 'جمعية بريطانية متخصصة في البحث العلمي والتطوير الطبي في مجال الخصوبة وعلاج العقم. نجمع نخبة الأطباء والباحثين من حول العالم لتبادل الخبرات، وتنظيم المؤتمرات، والاطلاع على أحدث المستجدات الطبية.',
    learn_more: 'اعرف المزيد ←',
    // events
    events_eyebrow: 'الأحداث القادمة',
    events_title: 'المؤتمرات والفعاليات',
    events_empty: 'سيتم الإعلان عن المؤتمرات القادمة قريباً.',
    events_all: 'كل المؤتمرات ←',
    // news
    news_eyebrow: 'النشاطات والأخبار',
    news_title: 'آخر المستجدات',
    news_empty: 'لا توجد نشاطات منشورة بعد.',
    news_all: 'كل النشاطات ←',
    // why
    why_eyebrow: 'لماذا الانضمام',
    why_title: 'مزايا العضوية',
    why_1_t: 'شهادات التطوير المهني', why_1_d: 'حضور مؤتمرات معتمدة للتطوير المهني المستمر (CPD).',
    why_2_t: 'شبكة عالمية', why_2_d: 'تواصل مع أطباء ومتخصصين من أكثر من 30 دولة.',
    why_3_t: 'أحدث الأبحاث', why_3_d: 'اطّلاع مباشر على آخر المستجدات في علوم الخصوبة.',
    why_4_t: 'دعوات رسمية', why_4_d: 'إصدار دعوات حضور موثّقة للمؤتمرات الدولية.',
    // stats
    stat_doctors: 'طبيب متخصص', stat_confs: 'مؤتمر', stat_countries: 'دولة', stat_research: 'بحث منشور',
    // cta
    cta_title: 'انضم إلى مجتمع الأطباء العالمي',
    cta_text: 'سجّل حسابك المجاني وابدأ رحلتك مع الجمعية.',
    cta_btn: 'إنشاء حساب طبيب',
    // footer
    foot_contact: 'تواصل', foot_links: 'روابط',
    foot_rights: '© 2026 Fertility Global Research. جميع الحقوق محفوظة.',
    // auth
    auth_login_title: 'تسجيل الدخول',
    auth_register_title: 'إنشاء حساب طبيب',
    auth_register_sub: 'سجّل بياناتك للانضمام',
    auth_email: 'البريد الإلكتروني',
    auth_password: 'كلمة المرور',
    auth_password_confirm: 'تأكيد كلمة المرور',
    auth_password_mismatch: 'كلمتا المرور غير متطابقتين',
    auth_forgot: 'نسيت كلمة المرور؟',
    auth_reset_title: 'استعادة كلمة المرور',
    auth_reset_sub: 'أدخل بريدك وسنرسل لك رابط الاستعادة',
    auth_reset_btn: 'إرسال رابط الاستعادة',
    auth_reset_sent: 'تم إرسال رابط الاستعادة إلى بريدك ✓',
    reg_phone: 'رقم الهاتف',
    reg_clinic: 'عنوان العيادة',
    reg_profession: 'المهنة',
    prof_doctor: 'طبيب',
    prof_pharmacist: 'صيدلي',
    prof_medical: 'مهنة طبية أخرى',
    dir_doctors: 'دليل الأطباء',
    dir_pharmacists: 'دليل الصيادلة',
    dir_medical: 'دليل المهن الطبية',
    report_btn: 'إبلاغ عن حساب وهمي',
    report_title: 'الإبلاغ عن أمر مشبوه',
    report_about: 'الحساب / الاسم المبلَّغ عنه',
    report_reason: 'سبب البلاغ',
    report_send: 'إرسال البلاغ',
    report_sent: 'تم إرسال بلاغك. شكراً لك ✓',
    auth_login_btn: 'دخول',
    auth_login_loading: 'جاري الدخول...',
    auth_or: 'أو',
    auth_google: 'المتابعة بحساب Google',
    auth_google_off: 'تسجيل الدخول بجوجل غير مفعّل بعد. استخدم البريد الإلكتروني.',
    auth_no_account: 'ليس لديك حساب؟',
    auth_create: 'إنشاء حساب جديد',
    auth_have_account: 'لديك حساب؟',
    auth_back: '← العودة للموقع',
    reg_name: 'الاسم الكامل', reg_specialty: 'التخصص', reg_hospital: 'المستشفى / المركز',
    reg_passport: 'رقم الجواز', reg_nationality: 'الجنسية', reg_years: 'سنوات الخبرة',
    reg_fertility: 'متخصص في الخصوبة', reg_create_btn: 'إنشاء حساب', reg_creating: 'جاري الإنشاء...',
    reg_done: 'تم إنشاء حسابك ✓', reg_redirect: 'جاري تحويلك لتسجيل الدخول...',
  },
  en: {
    dir: 'ltr',
    brand: 'Fertility Global Research',
    nav_home: 'Home',
    nav_about: 'About',
    nav_news: 'Activities',
    nav_conferences: 'Conferences',
    nav_directory: 'Doctors',
    nav_profile: 'My Profile',
    nav_admin: 'Admin',
    nav_login: 'Sign in',
    nav_logout: 'Sign out',
    hero_sub: 'Global Fertility Research Association',
    hero_tag: 'Advancing Fertility Science Worldwide',
    hero_cta_about: 'About the association',
    hero_cta_login: 'Doctor sign in',
    intro_eyebrow: 'About',
    intro_title: 'A global platform for fertility research',
    intro_text: 'A UK-based organization dedicated to fertility research and medical advancement, connecting leading doctors and researchers worldwide through conferences, training, and shared knowledge.',
    learn_more: 'Learn more →',
    events_eyebrow: 'Upcoming Events',
    events_title: 'Conferences & Events',
    events_empty: 'Upcoming conferences will be announced soon.',
    events_all: 'All conferences →',
    news_eyebrow: 'News & Activities',
    news_title: 'Latest updates',
    news_empty: 'No activities published yet.',
    news_all: 'All activities →',
    why_eyebrow: 'Why Join',
    why_title: 'Membership benefits',
    why_1_t: 'CPD Certificates', why_1_d: 'Attend accredited conferences for Continuing Professional Development.',
    why_2_t: 'Global Network', why_2_d: 'Connect with doctors and specialists from 30+ countries.',
    why_3_t: 'Latest Research', why_3_d: 'Direct access to the latest in fertility science.',
    why_4_t: 'Official Invitations', why_4_d: 'Verified attendance invitations for international conferences.',
    stat_doctors: 'Specialist doctors', stat_confs: 'Conferences', stat_countries: 'Countries', stat_research: 'Published papers',
    cta_title: 'Join the global medical community',
    cta_text: 'Create your free account and start your journey with us.',
    cta_btn: 'Create doctor account',
    foot_contact: 'Contact', foot_links: 'Links',
    foot_rights: '© 2026 Fertility Global Research. All rights reserved.',
    auth_login_title: 'Sign in',
    auth_register_title: 'Create doctor account',
    auth_register_sub: 'Register your details to join',
    auth_email: 'Email',
    auth_password: 'Password',
    auth_password_confirm: 'Confirm password',
    auth_password_mismatch: 'Passwords do not match',
    auth_forgot: 'Forgot password?',
    auth_reset_title: 'Reset password',
    auth_reset_sub: 'Enter your email and we will send a reset link',
    auth_reset_btn: 'Send reset link',
    auth_reset_sent: 'Reset link sent to your email ✓',
    reg_phone: 'Phone number',
    reg_clinic: 'Clinic address',
    reg_profession: 'Profession',
    prof_doctor: 'Doctor',
    prof_pharmacist: 'Pharmacist',
    prof_medical: 'Other medical profession',
    dir_doctors: 'Doctors Directory',
    dir_pharmacists: 'Pharmacists Directory',
    dir_medical: 'Medical Professions Directory',
    report_btn: 'Report a fake account',
    report_title: 'Report something suspicious',
    report_about: 'Reported account / name',
    report_reason: 'Reason for report',
    report_send: 'Send report',
    report_sent: 'Your report has been sent. Thank you ✓',
    auth_login_btn: 'Sign in',
    auth_login_loading: 'Signing in...',
    auth_or: 'or',
    auth_google: 'Continue with Google',
    auth_google_off: 'Google sign-in is not enabled yet. Please use email.',
    auth_no_account: "Don't have an account?",
    auth_create: 'Create new account',
    auth_have_account: 'Already have an account?',
    auth_back: '← Back to site',
    reg_name: 'Full name', reg_specialty: 'Specialty', reg_hospital: 'Hospital / Center',
    reg_passport: 'Passport number', reg_nationality: 'Nationality', reg_years: 'Years of experience',
    reg_fertility: 'Fertility specialist', reg_create_btn: 'Create account', reg_creating: 'Creating...',
    reg_done: 'Account created ✓', reg_redirect: 'Redirecting to sign in...',
  }
}

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('fgr_lang') || 'ar')

  useEffect(() => {
    localStorage.setItem('fgr_lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = translations[lang].dir
  }, [lang])

  const t = (key) => translations[lang][key] ?? key
  const toggle = () => setLang(l => (l === 'ar' ? 'en' : 'ar'))

  return (
    <LangContext.Provider value={{ lang, t, toggle, dir: translations[lang].dir }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) return { lang: 'ar', t: (k) => k, toggle: () => {}, dir: 'rtl' }
  return ctx
}
