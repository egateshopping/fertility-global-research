import jsPDF from 'jspdf'

const loadImageAsBase64 = (url, maxW = 300, quality = 0.7) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Scale down to maxW to reduce PDF size
      const scale = img.width > maxW ? maxW / img.width : 1
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

const addHeader = async (pdf, navy, teal, white) => {
  pdf.setFillColor(...navy)
  pdf.rect(0, 0, 210, 36, 'F')
  pdf.setFillColor(...teal)
  pdf.rect(0, 34, 210, 3, 'F')
  try {
    const logo = await loadImageAsBase64('/logo.png', 350, 0.85)
    if (logo) pdf.addImage(logo, 'PNG', 8, 2, 32, 32)
  } catch (_) {}
  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('FERTILITY GLOBAL RESEARCH', 42, 13)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Advancing Fertility Science Worldwide', 42, 20)
  pdf.text('London, United Kingdom  |  fertility-global.org', 42, 26)
  pdf.setFontSize(7.5)
  pdf.text('From: Fertility Global Research', 200, 10, { align: 'right' })
  pdf.text('London, United Kingdom', 200, 16, { align: 'right' })
  pdf.text('contact@fertility-global.org', 200, 22, { align: 'right' })
}

const addFooter = (pdf, navy, teal, white) => {
  pdf.setFillColor(...teal)
  pdf.rect(0, 280, 210, 2, 'F')
  pdf.setFillColor(...navy)
  pdf.rect(0, 282, 210, 15, 'F')
  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.text('Fertility Global Research  |  London, United Kingdom', 20, 291)
  pdf.text('contact@fertility-global.org  |  fertility-global.org', 190, 291, { align: 'right' })
}

export const generateInvitationPDF = async (doctor, conference, invitation) => {
  const pdf = new jsPDF('p', 'mm', 'a4')

  const navy  = [11, 46, 92]
  const teal  = [26, 143, 168]
  const white = [255, 255, 255]
  const black = [30, 30, 30]
  const grey  = [90, 90, 90]
  const skyBg = [235, 247, 252]

  // ══════════════════════════════════════════════
  //  PAGE 1 — INVITATION LETTER
  // ══════════════════════════════════════════════
  await addHeader(pdf, navy, teal, white)

  pdf.setTextColor(...navy)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('Invitation Letter', 105, 50, { align: 'center' })
  pdf.setDrawColor(...teal)
  pdf.setLineWidth(0.6)
  pdf.line(20, 53, 190, 53)

  let y = 62

  // TO block
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...navy)
  pdf.text('To:', 20, y)

  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...black)
  pdf.text(doctor.full_name || '', 20, y + 7)

  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9)
  const toLines = []
  if (doctor.address)       toLines.push(doctor.address)
  if (doctor.city && doctor.governorate) toLines.push(`${doctor.city}, ${doctor.governorate}`)
  else if (doctor.city)     toLines.push(doctor.city)
  if (doctor.nationality)   toLines.push(doctor.nationality)
  if (doctor.date_of_birth) toLines.push(`DOB: ${doctor.date_of_birth}`)
  if (doctor.specialty)     toLines.push(doctor.specialty)
  if (doctor.hospital)      toLines.push(doctor.hospital)
  if (doctor.passport_number && doctor.passport_number !== 'N/A')
    toLines.push(`Passport No.: ${doctor.passport_number}`)
  if (doctor.syndicate_id)  toLines.push(`Syndicate ID: ${doctor.syndicate_id}`)

  toLines.forEach((line, i) => {
    pdf.text(line, 20, y + 14 + i * 5.5)
  })

  pdf.setFontSize(8.5)
  pdf.setTextColor(...grey)
  pdf.text(`Ref: ${invitation.invitation_number}`, 190, y + 7, { align: 'right' })
  pdf.text(`Date: ${invitation.issue_date}`, 190, y + 13, { align: 'right' })

  y += 14 + toLines.length * 5.5 + 8

  // RE line
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...black)
  const reLine = `Re: Invitation for ${doctor.full_name} to Attend — ${conference.title}`
  const reWrapped = pdf.splitTextToSize(reLine, 170)
  reWrapped.forEach(l => { pdf.text(l, 20, y); y += 5.5 })
  y += 5

  // Dear
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Dear Dr. ${doctor.full_name},`, 20, y)
  y += 8
  pdf.text('I am writing to invite you on behalf of Fertility Global Research to attend', 20, y); y += 5.5
  pdf.text('and participate in the upcoming event:', 20, y); y += 10

  // Conference highlight box
  pdf.setFillColor(...skyBg)
  pdf.roundedRect(30, y - 3, 150, 26, 3, 3, 'F')
  pdf.setDrawColor(...teal)
  pdf.setLineWidth(0.5)
  pdf.roundedRect(30, y - 3, 150, 26, 3, 3, 'S')
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...teal)
  pdf.text(conference.title || '', 105, y + 5, { align: 'center' })
  pdf.setFontSize(9)
  pdf.text(`${conference.start_date || ''}${conference.end_date ? ' — ' + conference.end_date : ''}`, 105, y + 12, { align: 'center' })
  pdf.setTextColor(...navy)
  pdf.text(conference.location || '', 105, y + 19, { align: 'center' })
  y += 32

  // Body paragraphs
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...black)

  const paras = [
    `The programme will include a variety of scientific presentations covering the recent advances in fertility medicine and reproductive science. There will be workshops on ${conference.start_date || 'the first day'} to cover medical education and training.`,
    `Fertility Global Research was established to maintain and strengthen active interaction within the medical community in the UK and internationally. The participation of consultants and experts from across the world helps to promote advances in healthcare services.`,
    `This medical conference will bring together leading medical professionals from around the world to discuss the latest advancements, research findings, and best practices in Medicine and fertility science.`,
    `We believe your expertise as ${doctor.specialty ? 'a specialist in ' + doctor.specialty : 'a qualified medical professional'} at ${doctor.hospital || 'your institution'} would be a valuable addition to the conference. Your participation and input in the scientific programme will help to discuss the challenges facing health professionals and healthcare services.`,

  ]

  paras.forEach(para => {
    const lines = pdf.splitTextToSize(para, 170)
    lines.forEach(line => { pdf.text(line, 20, y); y += 5 })
    y += 2
  })

  // check overflow after all paras
  if (y > 248) { addFooter(pdf, navy, teal, white); pdf.addPage(); y = 50; }

  y += 4
  if (y > 248) { addFooter(pdf, navy, teal, white); pdf.addPage(); y = 50 }
  pdf.text('Yours sincerely,', 20, y)
  y += 7

  // Signature
  try {
    const sig = await loadImageAsBase64('/signature.png', 400, 0.8)
    if (sig) { pdf.addImage(sig, 'PNG', 20, y, 50, 20); y += 24 }
  } catch (_) { y += 8 }

  if (y > 262) { addFooter(pdf, navy, teal, white); pdf.addPage(); y = 20 }
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...navy)
  pdf.text('Mohammed Khayyat', 20, y); y += 5.5
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...grey)
  pdf.text('President', 20, y); y += 5
  pdf.text('Fertility Global Research', 20, y); y += 5
  pdf.text('London, United Kingdom', 20, y)

  // QR code bottom right
  try {
    const QRCode = await import('qrcode')
    const qr = await QRCode.default.toDataURL(
      `https://fertility-global.org/verify/${invitation.invitation_number}`,
      { width: 100, margin: 1, color: { dark: '#0B2E5C', light: '#FFFFFF' } }
    )
    if (qr) {
      pdf.addImage(qr, 'PNG', 160, 248, 28, 28)
      pdf.setFont('Helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(...grey)
      pdf.text('Scan to verify', 174, 278, { align: 'center' })
    }
  } catch (_) {}

  // ══════════════════════════════════════════════
  //  PAGE 2 — EVENT DETAILS & CONFIRMATION
  // ══════════════════════════════════════════════
  // Always start confirmation on a fresh page for clean layout
  addFooter(pdf, navy, teal, white)
  pdf.addPage()
  await addHeader(pdf, navy, teal, white)

  pdf.setTextColor(...navy)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('Confirmation of Registration', 105, 50, { align: 'center' })
  pdf.setDrawColor(...teal)
  pdf.setLineWidth(0.6)
  pdf.line(20, 53, 190, 53)
  y = 62

  // Confirmation box
  pdf.setFillColor(...skyBg)
  pdf.roundedRect(20, y, 170, 40, 3, 3, 'F')
  pdf.setFont('Helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...navy)
  pdf.text(`Dear Dr. ${doctor.full_name}`, 25, y + 8)
  pdf.setFont('Helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...black)
  pdf.text(`Confirmation Number: ${invitation.invitation_number}`, 25, y + 15)
  pdf.text(`This letter confirms your registration for: ${conference.title || ''}`, 25, y + 22)
  pdf.text(`Dates: ${conference.start_date || ''}${conference.end_date ? ' — ' + conference.end_date : ''}`, 25, y + 29)
  pdf.text(`Location: ${conference.location || ''}`, 25, y + 36)
  y += 48

  // Registration Details
  pdf.setFont('Helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...navy)
  pdf.text('Your Registration Details:', 20, y); y += 8

  const regDetails = [
    ['Name:', doctor.full_name || ''],
    ['Email:', doctor.email || ''],
    ['Passport No.:', doctor.passport_number && doctor.passport_number !== 'N/A' ? doctor.passport_number : '—'],
    ['Syndicate ID:', doctor.syndicate_id || '—'],
    ['Specialty:', doctor.specialty || '—'],
    ['Nationality:', doctor.nationality || '—'],
    ['Ticket Type:', 'Option A'],
    ['Number of Tickets:', '1'],
  ]

  regDetails.forEach(([label, value]) => {
    pdf.setFont('Helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...grey)
    pdf.text(label, 20, y)
    pdf.setFont('Helvetica', 'normal'); pdf.setTextColor(...black)
    pdf.text(value, 65, y)
    y += 6.5
  })

  y += 6

  // Event Information
  pdf.setFont('Helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(...navy)
  pdf.text('Event Information:', 20, y); y += 8
  pdf.setDrawColor(...teal); pdf.setLineWidth(0.4); pdf.line(20, y - 2, 190, y - 2)
  y += 2

  const eventInfo = [
    ['Date:', `${conference.start_date || ''}${conference.end_date ? ' — ' + conference.end_date : ''}`],
    ['Time:', 'Conference 9:00am – 5:30pm  |  Gala Dinner 7:00pm – 12:00am (Saturday)'],
    ['Location:', conference.location || ''],
    ['Travel Date:', invitation.travel_date || '—'],
    ['Meeting Dress Code:', 'Business Casual'],
    ['Gala Dinner Dress Code:', 'Semi-formal Gala'],
  ]

  eventInfo.forEach(([label, value]) => {
    pdf.setFont('Helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...navy)
    pdf.text(label, 20, y)
    pdf.setFont('Helvetica', 'normal'); pdf.setTextColor(...black)
    const wrapped = pdf.splitTextToSize(value, 120)
    wrapped.forEach((l, i) => pdf.text(l, 75, y + i * 5))
    y += wrapped.length * 5 + 2
  })

  y += 6

  // CPD & Networking
  pdf.setFont('Helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor(...black)
  const p2paras = [
    'We are excited to have you join us for this important event, which will feature world-renowned speakers and experts in a variety of medical fields. The conference will cover a wide range of topics and will attract recognition from the Royal College of Physicians for the purpose of Continuous Professional Development (CPD).',
    'In addition to the educational sessions, the conference will also offer opportunities for networking and socializing. We encourage you to take advantage of these opportunities to meet other medical professionals from around the world.',
    'Please note that you will need to check in at the registration desk on the day of the conference to receive your badge and materials. If you have any questions, please do not hesitate to contact us.',
  ]

  p2paras.forEach(para => {
    if (y > 248) { addFooter(pdf, navy, teal, white); pdf.addPage(); y = 20 }
    const lines = pdf.splitTextToSize(para, 170)
    lines.forEach(l => { pdf.text(l, 20, y); y += 5.5 })
    y += 4
  })

  y += 4

  // Terms
  pdf.setFont('Helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...navy)
  pdf.text('Terms and Conditions:', 20, y); y += 7

  const terms = [
    'This invitation is non-transferable and issued for the named individual only.',
    'The invitation holder agrees to abide by all conference rules and regulations.',
    'Fertility Global Research is not responsible for visa decisions made by any authority.',
    'The association does not bear responsibility for travel, accommodation, or related costs.',
    'Dress code: Business Casual for conference sessions, Semi-formal for Gala Dinner.',
  ]

  pdf.setFont('Helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...black)
  terms.forEach(term => {
    if (y > 248) { addFooter(pdf, navy, teal, white); pdf.addPage(); y = 20 }
    const lines = pdf.splitTextToSize(`• ${term}`, 165)
    lines.forEach(l => { pdf.text(l, 23, y); y += 5.5 })
    y += 1
  })

  y += 8
  pdf.setFont('Helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor(...black)
  pdf.text('Thank you for registering for the Annual Medical Conference 2026!', 105, y, { align: 'center' }); y += 6
  pdf.text('We look forward to seeing you at the conference.', 105, y, { align: 'center' }); y += 10
  pdf.text('Sincerely,', 20, y); y += 10

  try {
    const sig = await loadImageAsBase64('/signature.png', 400, 0.8)
    if (sig) { pdf.addImage(sig, 'PNG', 20, y, 50, 20); y += 24 }
  } catch (_) { y += 8 }

  pdf.setFont('Helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...navy)
  pdf.text('Mohammed Khayyat', 20, y); y += 5.5
  pdf.setFont('Helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...grey)
  pdf.text('President — Fertility Global Research', 20, y); y += 5
  pdf.text('contact@fertility-global.org  |  fertility-global.org', 20, y)

  addFooter(pdf, navy, teal, white)

  return pdf
}
