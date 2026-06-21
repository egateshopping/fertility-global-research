import jsPDF from 'jspdf'

// Load an image URL as base64 for jsPDF
const loadImageAsBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

export const generateInvitationPDF = async (doctor, conference, invitation) => {
  const pdf = new jsPDF('p', 'mm', 'a4')

  const teal   = [26, 143, 168]
  const navy   = [11, 46, 92]
  const white  = [255, 255, 255]
  const black  = [0, 0, 0]
  const grey   = [100, 100, 100]

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  pdf.setFillColor(...navy)
  pdf.rect(0, 0, 210, 42, 'F')
  pdf.setFillColor(...teal)
  pdf.rect(0, 38, 210, 4, 'F')

  // Logo (top-left)
  try {
    const logoB64 = await loadImageAsBase64('/logo.png')
    if (logoB64) pdf.addImage(logoB64, 'PNG', 12, 5, 28, 28)
  } catch (_) {}

  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('FERTILITY GLOBAL RESEARCH', 44, 17)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text('Advancing Fertility Science Worldwide', 44, 24)
  pdf.setFontSize(8)
  pdf.text('London, United Kingdom  |  contact@fertility-global.org', 44, 30)

  // ── INVITATION TITLE ─────────────────────────────────────────────────────
  pdf.setTextColor(...navy)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('INVITATION LETTER', 105, 54, { align: 'center' })
  pdf.setDrawColor(...teal)
  pdf.setLineWidth(0.6)
  pdf.line(20, 57, 190, 57)

  // ── META ROW ─────────────────────────────────────────────────────────────
  pdf.setTextColor(...grey)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Invitation No: ${invitation.invitation_number}`, 20, 63)
  pdf.text(`Issue Date: ${invitation.issue_date}`, 105, 63, { align: 'center' })
  pdf.text(`Travel Date: ${invitation.travel_date || '—'}`, 190, 63, { align: 'right' })

  pdf.setDrawColor(220, 220, 220)
  pdf.setLineWidth(0.3)
  pdf.line(20, 66, 190, 66)

  // ── TO / FROM ────────────────────────────────────────────────────────────
  let y = 74

  // TO block
  pdf.setTextColor(...navy)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('TO:', 20, y)

  pdf.setFont('Helvetica', 'normal')
  pdf.setTextColor(...black)
  const toLines = [
    `Dr. ${doctor.full_name}`,
    `Passport No.: ${doctor.passport_number}`,
    `Specialty: ${doctor.specialty}`,
    `Hospital: ${doctor.hospital}`,
    `Nationality: ${doctor.nationality}`,
  ]
  toLines.forEach((line, i) => {
    pdf.setFontSize(i === 0 ? 10 : 9)
    if (i === 0) pdf.setFont('Helvetica', 'bold')
    else pdf.setFont('Helvetica', 'normal')
    pdf.text(line, 30, y + 7 + i * 6)
  })

  // FROM block (right column)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...navy)
  pdf.text('FROM:', 115, y)
  pdf.setFont('Helvetica', 'normal')
  pdf.setTextColor(...black)
  const fromLines = [
    'Fertility Global Research',
    'London, United Kingdom',
    'contact@fertility-global.org',
    'fertility-global.org',
  ]
  fromLines.forEach((line, i) => {
    pdf.setFontSize(i === 0 ? 10 : 9)
    if (i === 0) pdf.setFont('Helvetica', 'bold')
    else pdf.setFont('Helvetica', 'normal')
    pdf.text(line, 125, y + 7 + i * 6)
  })

  y += 44

  pdf.setDrawColor(220, 220, 220)
  pdf.line(20, y, 190, y)
  y += 8

  // ── SUBJECT ──────────────────────────────────────────────────────────────
  pdf.setFillColor(240, 248, 252)
  pdf.roundedRect(20, y - 4, 170, 10, 2, 2, 'F')
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...navy)
  pdf.text(`RE: Invitation to attend — ${conference.title}`, 25, y + 3)
  y += 14

  // ── BODY ─────────────────────────────────────────────────────────────────
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...black)

  const bodyParagraphs = [
    `Dear Dr. ${doctor.full_name},`,
    '',
    `We are pleased and honoured to invite you to attend and participate in the upcoming event organised by Fertility Global Research:`,
    '',
    `    ${conference.title}`,
    `    ${conference.location}`,
    `    ${conference.start_date}${conference.end_date ? ' — ' + conference.end_date : ''}`,
    '',
    `The conference programme will include scientific presentations covering recent advances in fertility medicine and reproductive science, as well as workshops on medical education, training, and best practice.`,
    '',
    `Your expertise and participation would be a valuable contribution to the scientific programme. We look forward to welcoming you.`,
    '',
    `Yours sincerely,`,
  ]

  bodyParagraphs.forEach(line => {
    if (y > 250) { pdf.addPage(); y = 20 }
    if (line === '') { y += 4; return }
    const wrapped = pdf.splitTextToSize(line, 170)
    wrapped.forEach(wl => {
      pdf.text(wl, 20, y)
      y += 6
    })
  })

  y += 4

  // ── SIGNATURE ────────────────────────────────────────────────────────────
  if (y > 230) { pdf.addPage(); y = 20 }

  try {
    const sigB64 = await loadImageAsBase64('/signature.jpg')
    if (sigB64) {
      // Draw signature image (keep aspect; width 50mm)
      pdf.addImage(sigB64, 'JPEG', 20, y, 50, 22)
      y += 26
    }
  } catch (_) { y += 10 }

  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...navy)
  pdf.text('Mohammed Khayyat', 20, y)
  y += 6
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...grey)
  pdf.text('President', 20, y)
  y += 5
  pdf.text('Fertility Global Research', 20, y)
  y += 5
  pdf.text('London, United Kingdom', 20, y)

  // ── FOOTER BAND ──────────────────────────────────────────────────────────
  pdf.setFillColor(...navy)
  pdf.rect(0, 282, 210, 15, 'F')
  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.text('Fertility Global Research  |  London, United Kingdom', 20, 290)
  pdf.text('contact@fertility-global.org  |  fertility-global.org', 190, 290, { align: 'right' })

  return pdf
}
