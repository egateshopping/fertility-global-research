import jsPDF from 'jspdf'

// Load logo with white background
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

// Load signature with TRANSPARENT background (removes grey/white)
const loadSignatureTransparent = (url) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      // Make light pixels (grey/white background) transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const brightness = (r + g + b) / 3
        if (brightness > 180) {
          data[i + 3] = 0 // fully transparent
        }
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

export const generateInvitationPDF = async (doctor, conference, invitation) => {
  const pdf = new jsPDF('p', 'mm', 'a4')

  const navy   = [11, 46, 92]
  const teal   = [26, 143, 168]
  const white  = [255, 255, 255]
  const black  = [30, 30, 30]
  const grey   = [100, 100, 100]
  const sky    = [235, 247, 252]

  // ── HEADER ───────────────────────────────────────────────────────────────
  pdf.setFillColor(...navy)
  pdf.rect(0, 0, 210, 38, 'F')
  pdf.setFillColor(...teal)
  pdf.rect(0, 35, 210, 3, 'F')

  try {
    const logoB64 = await loadImageAsBase64('/logo.png')
    if (logoB64) pdf.addImage(logoB64, 'PNG', 10, 4, 28, 28)
  } catch (_) {}

  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('FERTILITY GLOBAL RESEARCH', 42, 16)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('Advancing Fertility Science Worldwide', 42, 22)
  pdf.text('London, United Kingdom  |  fertility-global.org', 42, 28)

  // ── TITLE ─────────────────────────────────────────────────────────────────
  pdf.setTextColor(...navy)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('INVITATION LETTER', 105, 50, { align: 'center' })
  pdf.setDrawColor(...teal)
  pdf.setLineWidth(0.7)
  pdf.line(20, 53, 190, 53)

  // ── META ──────────────────────────────────────────────────────────────────
  pdf.setTextColor(...grey)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(`Invitation No: ${invitation.invitation_number}`, 20, 59)
  pdf.text(`Issue Date: ${invitation.issue_date}`, 105, 59, { align: 'center' })
  pdf.text(`Travel Date: ${invitation.travel_date || '—'}`, 190, 59, { align: 'right' })
  pdf.setDrawColor(210, 210, 210)
  pdf.setLineWidth(0.3)
  pdf.line(20, 62, 190, 62)

  let y = 70

  // ── TO / FROM TWO-COLUMN ─────────────────────────────────────────────────
  // TO block (left)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...teal)
  pdf.text('TO:', 20, y)

  const toLines = [
    ['Full Name:', `Dr. ${doctor.full_name}`],
    ['Passport No.:', doctor.passport_number || '—'],
    ['Syndicate ID:', doctor.syndicate_id || '—'],
    ['Specialty:', doctor.specialty || '—'],
    ['Hospital:', doctor.hospital || '—'],
    ['Nationality:', doctor.nationality || '—'],
    ['City:', `${doctor.city || '—'}${doctor.governorate ? ', ' + doctor.governorate : ''}`],
  ]

  toLines.forEach(([label, value], i) => {
    pdf.setFont('Helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...grey)
    pdf.text(label, 20, y + 7 + i * 6)
    pdf.setFont('Helvetica', 'normal')
    pdf.setTextColor(...black)
    pdf.text(value, 52, y + 7 + i * 6)
  })

  // FROM block (right)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...teal)
  pdf.text('FROM:', 115, y)

  const fromLines = [
    ['Organization:', 'Fertility Global Research'],
    ['Address:', 'London, United Kingdom'],
    ['Email:', 'contact@fertility-global.org'],
    ['Website:', 'fertility-global.org'],
  ]

  fromLines.forEach(([label, value], i) => {
    pdf.setFont('Helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...grey)
    pdf.text(label, 115, y + 7 + i * 6)
    pdf.setFont('Helvetica', 'normal')
    pdf.setTextColor(...black)
    pdf.text(value, 142, y + 7 + i * 6)
  })

  y += 52

  pdf.setDrawColor(210, 210, 210)
  pdf.setLineWidth(0.3)
  pdf.line(20, y, 190, y)
  y += 8

  // ── CONFERENCE HIGHLIGHT BOX ──────────────────────────────────────────────
  pdf.setFillColor(...sky)
  pdf.roundedRect(20, y - 3, 170, 22, 3, 3, 'F')
  pdf.setDrawColor(...teal)
  pdf.setLineWidth(0.5)
  pdf.roundedRect(20, y - 3, 170, 22, 3, 3, 'S')

  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.setTextColor(...navy)
  pdf.text('RE:', 25, y + 5)
  pdf.setFont('Helvetica', 'bold')
  pdf.text(`Invitation to Attend — ${conference.title}`, 33, y + 5)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...grey)
  pdf.text(`📍 ${conference.location}`, 25, y + 12)
  pdf.text(`📅 ${conference.start_date}${conference.end_date ? ' — ' + conference.end_date : ''}`, 110, y + 12)
  y += 28

  // ── BODY ──────────────────────────────────────────────────────────────────
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...black)

  const body = [
    `Dear Dr. ${doctor.full_name},`,
    '',
    `We are pleased and honoured to invite you on behalf of Fertility Global Research to attend and participate in the above-mentioned conference.`,
    '',
    `The programme will include scientific presentations on the latest advances in fertility medicine and reproductive science, along with workshops on medical education, research, and best practice.`,
    '',
    `We believe your expertise as a specialist in ${doctor.specialty || 'your field'} will be a valued contribution to the scientific programme. Your participation will help advance knowledge and professional practice in this important area of medicine.`,
    '',
    `This invitation is issued for the purpose of facilitating your visa application and conference attendance only. Fertility Global Research does not bear responsibility for any visa decisions made by the relevant authorities.`,
    '',
    `We look forward to welcoming you at the conference.`,
    '',
    `Yours sincerely,`,
  ]

  body.forEach(line => {
    if (y > 255) { pdf.addPage(); y = 20 }
    if (line === '') { y += 3; return }
    const wrapped = pdf.splitTextToSize(line, 170)
    wrapped.forEach(wl => {
      pdf.text(wl, 20, y)
      y += 5.5
    })
  })

  y += 5

  // ── SIGNATURE ─────────────────────────────────────────────────────────────
  if (y > 240) { pdf.addPage(); y = 20 }

  try {
    const sigB64 = await loadSignatureTransparent('/signature.jpg')
    if (sigB64) {
      pdf.addImage(sigB64, 'PNG', 20, y, 52, 22)
      y += 26
    }
  } catch (_) { y += 8 }

  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...navy)
  pdf.text('Mohammed Khayyat', 20, y)
  y += 5
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...grey)
  pdf.text('President', 20, y); y += 4.5
  pdf.text('Fertility Global Research', 20, y); y += 4.5
  pdf.text('London, United Kingdom', 20, y)

  // ── FOOTER ────────────────────────────────────────────────────────────────
  pdf.setFillColor(...navy)
  pdf.rect(0, 282, 210, 15, 'F')
  pdf.setFillColor(...teal)
  pdf.rect(0, 280, 210, 2, 'F')
  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.text('Fertility Global Research  |  London, United Kingdom', 20, 290)
  pdf.text('contact@fertility-global.org  |  fertility-global.org', 190, 290, { align: 'right' })

  return pdf
}

// Generate QR code as base64 PNG
export const generateQRCode = async (text) => {
  try {
    const QRCode = await import('qrcode')
    const dataUrl = await QRCode.default.toDataURL(text, {
      width: 120, margin: 1,
      color: { dark: '#0B2E5C', light: '#FFFFFF' }
    })
    return dataUrl
  } catch (_) { return null }
}
