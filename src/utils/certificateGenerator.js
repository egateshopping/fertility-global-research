import jsPDF from 'jspdf'

const loadImage = (url, maxW = 300, quality = 0.85) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
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

const loadSignatureTransparent = (url, maxW = 300) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = img.width > maxW ? maxW / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < imageData.data.length; i += 4) {
        if ((imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3 > 180)
          imageData.data[i+3] = 0
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

export const generateCertificatePDF = async (doctor, certNumber, issueDate) => {
  // Landscape A4
  const pdf = new jsPDF('l', 'mm', 'a4')
  const W = 297, H = 210

  const navy  = [11, 46, 92]
  const teal  = [26, 143, 168]
  const gold  = [180, 140, 0]
  const goldL = [212, 175, 55]
  const black = [20, 20, 20]
  const grey  = [80, 80, 80]
  const white = [255, 255, 255]

  // ── WHITE BACKGROUND ─────────────────────────────────────────────────────
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, W, H, 'F')

  // ── GOLD OUTER BORDER ─────────────────────────────────────────────────────
  pdf.setDrawColor(...goldL)
  pdf.setLineWidth(4)
  pdf.rect(6, 6, W - 12, H - 12)

  // ── GOLD INNER BORDER ─────────────────────────────────────────────────────
  pdf.setLineWidth(1.2)
  pdf.rect(10, 10, W - 20, H - 20)

  // ── DECORATIVE CORNER LINES ───────────────────────────────────────────────
  pdf.setDrawColor(...goldL)
  pdf.setLineWidth(0.5)
  // top-left
  pdf.line(10, 20, 20, 20); pdf.line(20, 10, 20, 20)
  // top-right
  pdf.line(W-10, 20, W-20, 20); pdf.line(W-20, 10, W-20, 20)
  // bottom-left
  pdf.line(10, H-20, 20, H-20); pdf.line(20, H-10, 20, H-20)
  // bottom-right
  pdf.line(W-10, H-20, W-20, H-20); pdf.line(W-20, H-10, W-20, H-20)

  // ── HEADER TEAL BAR ───────────────────────────────────────────────────────
  pdf.setFillColor(...navy)
  pdf.rect(10, 10, W - 20, 28, 'F')
  pdf.setFillColor(...teal)
  pdf.rect(10, 36, W - 20, 2, 'F')

  // Logo
  try {
    const logo = await loadImage('/logo.png', 150, 0.6)
    if (logo) pdf.addImage(logo, 'JPEG', 15, 11, 26, 26)
  } catch (_) {}

  // Org name in header
  pdf.setTextColor(...white)
  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('GLOBAL FERTILITY RESEARCH', W / 2, 22, { align: 'center' })
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('London, United Kingdom  |  fertility-global.org  |  contact@fertility-global.org', W / 2, 30, { align: 'center' })

  // ── WATERMARK LOGO ────────────────────────────────────────────────────────
  try {
    const logo = await loadImage('/logo.png', 150, 0.25)
    if (logo) {
      pdf.saveGraphicsState()
      // Draw watermark - centered, large, very faint
      pdf.setGState(pdf.GState({ opacity: 0.06 }))
      pdf.addImage(logo, 'JPEG', W/2 - 50, H/2 - 42, 100, 84)
      pdf.restoreGraphicsState()
    }
  } catch (_) {}

  // ── TITLE ─────────────────────────────────────────────────────────────────
  pdf.setFont('Times', 'bolditalic')
  pdf.setFontSize(26)
  pdf.setTextColor(...navy)
  pdf.text('Membership Certificate', W / 2, 60, { align: 'center' })

  // Gold underline
  pdf.setDrawColor(...goldL)
  pdf.setLineWidth(0.8)
  pdf.line(W/2 - 55, 63, W/2 + 55, 63)

  // ── REG NUMBER & DATE (top right) ─────────────────────────────────────────
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...grey)
  pdf.text(`FGR Registration No: ${certNumber}`, W - 18, 55, { align: 'right' })
  pdf.text(`Date: ${issueDate}`, W - 18, 61, { align: 'right' })

  // ── CERTIFY TEXT ──────────────────────────────────────────────────────────
  pdf.setFont('Times', 'italic')
  pdf.setFontSize(13)
  pdf.setTextColor(...black)
  pdf.text('This is to certify that', W / 2, 78, { align: 'center' })

  // Doctor name — large
  pdf.setFont('Times', 'bolditalic')
  pdf.setFontSize(22)
  pdf.setTextColor(...navy)
  pdf.text(`Dr. ${doctor.full_name}`, W / 2, 90, { align: 'center' })

  // Gold line under name
  pdf.setDrawColor(...goldL)
  pdf.setLineWidth(0.6)
  const nameWidth = Math.min(pdf.getStringUnitWidth(`Dr. ${doctor.full_name}`) * 22 / pdf.internal.scaleFactor + 20, 180)
  pdf.line(W/2 - nameWidth/2, 93, W/2 + nameWidth/2, 93)

  // Body text — corrected grammar
  pdf.setFont('Times', 'italic')
  pdf.setFontSize(12)
  pdf.setTextColor(...black)

  const year = issueDate ? issueDate.split('-')[0] : String(new Date().getFullYear())

  pdf.text(`is an active member of Global Fertility Research for the year ${year},`, W / 2, 103, { align: 'center' })
  pdf.text(`and has agreed to abide by the Association's constitution and code of practice.`, W / 2, 111, { align: 'center' })
  pdf.text(`This membership is valid until 31 December ${year}.`, W / 2, 121, { align: 'center' })

  // Specialty + Affiliation lines (separated)
  let detailY = 131
  if (doctor.specialty) {
    pdf.setFont('Times', 'italic')
    pdf.setFontSize(10.5)
    pdf.setTextColor(...grey)
    pdf.text(`Specialty: ${doctor.specialty}`, W / 2, detailY, { align: 'center' })
    detailY += 6
  }
  if (doctor.affiliation || doctor.hospital) {
    pdf.setFont('Times', 'italic')
    pdf.setFontSize(10.5)
    pdf.setTextColor(...grey)
    pdf.text(`Affiliation: ${doctor.affiliation || doctor.hospital}`, W / 2, detailY, { align: 'center' })
  }

  // ── SIGNATURE ─────────────────────────────────────────────────────────────
  try {
    const sig = await loadSignatureTransparent('/signature.png', 300)
    if (sig) pdf.addImage(sig, 'PNG', W/2 - 25, 143, 50, 18)
  } catch (_) {}

  // Gold line above name
  pdf.setDrawColor(...goldL)
  pdf.setLineWidth(0.5)
  pdf.line(W/2 - 35, 163, W/2 + 35, 163)

  pdf.setFont('Times', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...navy)
  pdf.text('Mohammed Al-Khayat', W / 2, 169, { align: 'center' })

  pdf.setFont('Times', 'italic')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...grey)
  pdf.text('MBChB, MSc', W / 2, 175, { align: 'center' })
  pdf.text('President of Global Fertility Research', W / 2, 180, { align: 'center' })

  // ── QR CODE — bottom right corner ─────────────────────────────────────────
  try {
    const QRCode = await import('qrcode')
    const qr = await QRCode.default.toDataURL(
      `https://fertility-global.org/verify/cert/${certNumber}`,
      { width: 120, margin: 1, color: { dark: '#0B2E5C', light: '#FFFFFF' } }
    )
    if (qr) {
      pdf.addImage(qr, 'PNG', W - 52, H - 55, 30, 30)
      pdf.setFont('Helvetica', 'normal')
      pdf.setFontSize(6)
      pdf.setTextColor(...grey)
      pdf.text('Scan to verify', W - 37, H - 23, { align: 'center' })
    }
  } catch (_) {}

  // ── BOTTOM GOLD BAR ───────────────────────────────────────────────────────
  pdf.setFillColor(...navy)
  pdf.rect(10, H - 22, W - 20, 12, 'F')
  pdf.setFillColor(...teal)
  pdf.rect(10, H - 22, W - 20, 2, 'F')
  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...white)
  pdf.text('Global Fertility Research  |  London, United Kingdom  |  Company Reg: 17263260', W/2, H - 13, { align: 'center' })

  return pdf
}
