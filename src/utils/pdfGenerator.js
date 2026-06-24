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

// Load signature with transparent background
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
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3
        if (brightness > 180) data[i+3] = 0
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

export const generateInvitationPDF = async (doctor, conference, invitation) => {
  const pdf = new jsPDF('p', 'mm', 'a4')

  const navy  = [11, 46, 92]
  const teal  = [26, 143, 168]
  const white = [255, 255, 255]
  const black = [30, 30, 30]
  const grey  = [90, 90, 90]

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  pdf.setFillColor(...navy)
  pdf.rect(0, 0, 210, 36, 'F')
  pdf.setFillColor(...teal)
  pdf.rect(0, 34, 210, 3, 'F')

  try {
    const logoB64 = await loadImageAsBase64('/logo.png')
    if (logoB64) pdf.addImage(logoB64, 'PNG', 10, 3, 28, 28)
  } catch (_) {}

  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('FERTILITY GLOBAL RESEARCH', 42, 14)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('Advancing Fertility Science Worldwide', 42, 20)
  pdf.text('London, United Kingdom  |  fertility-global.org', 42, 26)

  // FROM block (top right)
  pdf.setFontSize(8)
  pdf.text('From:', 210, 10, { align: 'right' })
  pdf.setFont('Helvetica', 'bold')
  pdf.text('Fertility Global Research', 210, 15, { align: 'right' })
  pdf.setFont('Helvetica', 'normal')
  pdf.text('London, United Kingdom', 210, 20, { align: 'right' })
  pdf.text('contact@fertility-global.org', 210, 25, { align: 'right' })

  // ── TITLE ─────────────────────────────────────────────────────────────────
  pdf.setTextColor(...navy)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('Invitation Letter', 105, 50, { align: 'center' })
  pdf.setDrawColor(...teal)
  pdf.setLineWidth(0.6)
  pdf.line(20, 53, 190, 53)

  let y = 62

  // ── TO BLOCK ──────────────────────────────────────────────────────────────
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
  pdf.setTextColor(...black)

  const toLines = []
  if (doctor.address)      toLines.push(doctor.address)
  if (doctor.city && doctor.governorate) toLines.push(`${doctor.city}, ${doctor.governorate}`)
  else if (doctor.city)    toLines.push(doctor.city)
  if (doctor.nationality)  toLines.push(doctor.nationality)
  if (doctor.date_of_birth) toLines.push(`DOB: ${doctor.date_of_birth}`)
  if (doctor.specialty)    toLines.push(doctor.specialty)
  if (doctor.hospital)     toLines.push(doctor.hospital)

  toLines.forEach((line, i) => {
    pdf.text(line, 20, y + 14 + i * 5.5)
  })

  // Ref number top right
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...grey)
  pdf.text(`Ref: ${invitation.invitation_number}`, 190, y + 7, { align: 'right' })
  pdf.text(`Date: ${invitation.issue_date}`, 190, y + 13, { align: 'right' })

  y += 14 + toLines.length * 5.5 + 6

  // ── RE LINE ───────────────────────────────────────────────────────────────
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...black)
  pdf.text(`Re: Invitation for ${doctor.full_name} to Attend The Annual Medical Conference in London`, 20, y)
  y += 10

  // ── DEAR ──────────────────────────────────────────────────────────────────
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...black)
  pdf.text(`Dear Dr. ${doctor.full_name},`, 20, y)
  y += 8

  pdf.text('I am writing to invite you on behalf of Fertility Global Research to attend', 20, y)
  y += 5.5
  pdf.text('and participate in the upcoming event:', 20, y)
  y += 10

  // ── CONFERENCE HIGHLIGHT (centered, like Vitalonix) ───────────────────────
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...teal)
  pdf.text(conference.title || '', 105, y, { align: 'center' })
  y += 7

  if (conference.description) {
    pdf.setFontSize(10)
    pdf.text(conference.description, 105, y, { align: 'center' })
    y += 6
  }

  pdf.setFontSize(11)
  pdf.text(`${conference.start_date}${conference.end_date ? ' — ' + conference.end_date : ''}`, 105, y, { align: 'center' })
  y += 6
  pdf.text(conference.location || '', 105, y, { align: 'center' })
  y += 12

  // ── BODY PARAGRAPHS ───────────────────────────────────────────────────────
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(...black)

  const paragraphs = [
    `The programme will include a variety of scientific presentations covering the recent advances in fertility medicine and reproductive science. There will be workshops on ${conference.start_date} to cover medical education and training.`,
    `Fertility Global Research was established to maintain and strengthen active interaction within the medical community in the UK and internationally. The participation of consultants and experts helps to promote advances in health services worldwide.`,
    `This medical conference will bring together leading medical professionals from around the world to discuss the latest advancements, research findings, and best practices in Medicine.`,
    `We believe your expertise as ${doctor.specialty ? 'a specialist in ' + doctor.specialty : 'a medical professional'} at ${doctor.hospital || 'your institution'} would be a valuable addition to the conference. Your participation would allow you to engage in discussions and learn about the latest research and technological advancements in your field.`,
    `We look forward to welcoming you at the conference.`,
  ]

  paragraphs.forEach(para => {
    if (y > 250) { pdf.addPage(); y = 20 }
    const lines = pdf.splitTextToSize(para, 170)
    lines.forEach(line => {
      pdf.text(line, 20, y)
      y += 5.5
    })
    y += 3
  })

  y += 4
  pdf.text('Yours sincerely,', 20, y)
  y += 8

  // ── SIGNATURE ─────────────────────────────────────────────────────────────
  if (y > 240) { pdf.addPage(); y = 20 }

  try {
    const sigB64 = await loadImageAsBase64('/signature.png')
    if (sigB64) {
      pdf.addImage(sigB64, 'PNG', 20, y, 52, 22)
      y += 26
    }
  } catch (_) { y += 8 }

  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...navy)
  pdf.text('Mohammed Khayyat', 20, y)
  y += 5.5
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...grey)
  pdf.text('President', 20, y); y += 5
  pdf.text('Fertility Global Research', 20, y); y += 5
  pdf.text('London, United Kingdom', 20, y); y += 5
  pdf.text('contact@fertility-global.org', 20, y); y += 5
  pdf.text('fertility-global.org', 20, y)

  // ── PASSPORT / ID BOX (bottom left, like Vitalonix) ──────────────────────
  if (y < 240) {
    y += 10
    const boxLines = []
    if (doctor.passport_number && doctor.passport_number !== 'N/A')
      boxLines.push(`Passport No.: ${doctor.passport_number}`)
    if (doctor.syndicate_id)
      boxLines.push(`Syndicate ID: ${doctor.syndicate_id}`)
    if (doctor.date_of_birth)
      boxLines.push(`Date of Birth: ${doctor.date_of_birth}`)

    if (boxLines.length > 0) {
      pdf.setFillColor(235, 247, 252)
      pdf.roundedRect(20, y - 4, 100, boxLines.length * 6 + 8, 3, 3, 'F')
      pdf.setFont('Helvetica', 'normal')
      pdf.setFontSize(8.5)
      pdf.setTextColor(...navy)
      boxLines.forEach((line, i) => pdf.text(line, 25, y + 2 + i * 6))
    }
  }

  // ── QR CODE ───────────────────────────────────────────────────────────────
  try {
    const QRCode = await import('qrcode')
    const verifyUrl = `https://fertility-global.org/verify/${invitation.invitation_number}`
    const qrDataUrl = await QRCode.default.toDataURL(verifyUrl, {
      width: 100, margin: 1,
      color: { dark: '#0B2E5C', light: '#FFFFFF' }
    })
    if (qrDataUrl) {
      pdf.addImage(qrDataUrl, 'PNG', 160, 248, 28, 28)
      pdf.setFont('Helvetica', 'normal')
      pdf.setFontSize(6.5)
      pdf.setTextColor(...grey)
      pdf.text('Scan to verify', 174, 278, { align: 'center' })
    }
  } catch (_) {}

  // ── FOOTER ────────────────────────────────────────────────────────────────
  pdf.setFillColor(...teal)
  pdf.rect(0, 280, 210, 2, 'F')
  pdf.setFillColor(...navy)
  pdf.rect(0, 282, 210, 15, 'F')
  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.text('Fertility Global Research  |  London, United Kingdom', 20, 291)
  pdf.text('contact@fertility-global.org  |  fertility-global.org', 190, 291, { align: 'right' })

  return pdf
}
