import jsPDF from 'jspdf'

export const generateInvitationPDF = (doctor, conference, invitation) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Set up colors
  const primaryColor = [24, 174, 150] // Teal
  const darkColor = [15, 23, 42] // Dark blue
  const textColor = [0, 0, 0]
  
  // Header with logo area
  pdf.setFillColor(...primaryColor)
  pdf.rect(0, 0, 210, 60, 'F')
  
  // Title
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(24)
  pdf.text('FERTILITY GLOBAL RESEARCH', 20, 25)
  pdf.setFontSize(12)
  pdf.text('Advancing Fertility Science Worldwide', 20, 35)
  
  // Arabic title
  pdf.setFont('Arial', 'bold')
  pdf.text('جمعية الخصوبة العالمية للبحث العلمي', 190, 25, { align: 'right' })
  pdf.setFontSize(10)
  pdf.text('تقدم العلوم الطبية في مجال الخصوبة عالمياً', 190, 35, { align: 'right' })
  
  // Reset text color
  pdf.setTextColor(...textColor)
  
  // Invitation Letter Title
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('INVITATION LETTER', 20, 75)
  
  pdf.setFont('Arial', 'bold')
  pdf.setFontSize(16)
  pdf.text('خطاب دعوة', 190, 75, { align: 'right' })
  
  // Line separator
  pdf.setDrawColor(...primaryColor)
  pdf.setLineWidth(0.5)
  pdf.line(20, 80, 190, 80)
  
  // TO section
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('TO:', 20, 90)
  
  pdf.setFont('Arial', 'bold')
  pdf.setFontSize(11)
  pdf.text('إلى:', 190, 90, { align: 'right' })
  
  // Doctor information
  pdf.setFont('Helvetica', 'regular')
  pdf.setFontSize(10)
  let yPosition = 100
  
  const doctorInfo = [
    `Name: ${doctor.full_name}`,
    `Passport No: ${doctor.passport_number}`,
    `Specialty: ${doctor.specialty}`,
    `Hospital: ${doctor.hospital}`,
    `Nationality: ${doctor.nationality}`,
    `Email: ${doctor.email}`
  ]
  
  const doctorInfoAr = [
    `الاسم: ${doctor.full_name}`,
    `رقم الجواز: ${doctor.passport_number}`,
    `التخصص: ${doctor.specialty}`,
    `المستشفى: ${doctor.hospital}`,
    `الجنسية: ${doctor.nationality}`,
    `البريد الإلكتروني: ${doctor.email}`
  ]
  
  for (let i = 0; i < doctorInfo.length; i++) {
    pdf.setFont('Helvetica', 'regular')
    pdf.setFontSize(9)
    pdf.text(doctorInfo[i], 20, yPosition)
    
    pdf.setFont('Arial', 'regular')
    pdf.setFontSize(9)
    pdf.text(doctorInfoAr[i], 190, yPosition, { align: 'right' })
    
    yPosition += 6
  }
  
  // Space
  yPosition += 5
  
  // From section
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('FROM:', 20, yPosition)
  
  pdf.setFont('Arial', 'bold')
  pdf.text('من:', 190, yPosition, { align: 'right' })
  
  yPosition += 8
  
  // Organization info
  pdf.setFont('Helvetica', 'regular')
  pdf.setFontSize(9)
  const orgInfo = [
    'Fertility Global Research',
    'London, United Kingdom',
    'Email: contact@fertility-global.org'
  ]
  
  const orgInfoAr = [
    'جمعية الخصوبة العالمية للبحث العلمي',
    'لندن، المملكة المتحدة',
    'البريد الإلكتروني: contact@fertility-global.org'
  ]
  
  for (let i = 0; i < orgInfo.length; i++) {
    pdf.setFont('Helvetica', 'regular')
    pdf.text(orgInfo[i], 20, yPosition)
    
    pdf.setFont('Arial', 'regular')
    pdf.text(orgInfoAr[i], 190, yPosition, { align: 'right' })
    
    yPosition += 5
  }
  
  yPosition += 5
  
  // Invitation details
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('RE: Conference Invitation', 20, yPosition)
  
  pdf.setFont('Arial', 'bold')
  pdf.text('الموضوع: دعوة حضور مؤتمر', 190, yPosition, { align: 'right' })
  
  yPosition += 10
  
  // Body text
  pdf.setFont('Helvetica', 'regular')
  pdf.setFontSize(10)
  
  const bodyText = [
    'Dear Dr. ' + doctor.full_name + ',',
    '',
    'We are pleased to invite you to attend the upcoming conference:',
    '',
    conference.title,
    conference.location,
    conference.start_date + ' to ' + conference.end_date,
    '',
    'Invitation Details:',
    `Invitation Number: ${invitation.invitation_number}`,
    `Issue Date: ${invitation.issue_date}`,
    `Travel Date: ${invitation.travel_date}`,
    '',
    'We look forward to your participation and valuable contributions.',
    '',
    'Sincerely,',
    'Fertility Global Research'
  ]
  
  const bodyTextAr = [
    'سيادة الدكتور / الدكتورة ' + doctor.full_name + '،',
    '',
    'يسعدنا دعوتكم لحضور المؤتمر القادم:',
    '',
    conference.title,
    conference.location,
    conference.start_date + ' إلى ' + conference.end_date,
    '',
    'تفاصيل الدعوة:',
    `رقم الدعوة: ${invitation.invitation_number}`,
    `تاريخ الإصدار: ${invitation.issue_date}`,
    `تاريخ السفر: ${invitation.travel_date}`,
    '',
    'نتطلع إلى مشاركتكم وإسهاماتكم القيمة.',
    '',
    'مع خالص التقدير،',
    'جمعية الخصوبة العالمية للبحث العلمي'
  ]
  
  for (let i = 0; i < bodyText.length; i++) {
    pdf.setFont('Helvetica', 'regular')
    pdf.text(bodyText[i], 20, yPosition)
    
    pdf.setFont('Arial', 'regular')
    pdf.text(bodyTextAr[i], 190, yPosition, { align: 'right' })
    
    yPosition += 5
    
    if (yPosition > 270) {
      pdf.addPage()
      yPosition = 20
    }
  }
  
  // Footer
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285)
  pdf.text(`Valid for travel to ${conference.location}`, 190, 285, { align: 'right' })
  
  return pdf
}
