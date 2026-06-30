// Direct Resend email notifications (browser-based)
// ⚠️ Replace RESEND_API_KEY below with your actual key from resend.com

const RESEND_API_KEY = 'YOUR_RESEND_API_KEY_HERE'
const FROM_EMAIL = 'Global Fertility Research <contact@fertility-global.org>'

function wrap(content) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#0B2E5C;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:1px;">GLOBAL FERTILITY RESEARCH</h1>
      <p style="color:#1A8FA8;margin:4px 0 0;font-size:12px;">Advancing Fertility Science Worldwide</p>
    </div>
    <div style="padding:32px 28px;color:#333;line-height:1.6;">
      ${content}
    </div>
    <div style="background:#0B2E5C;padding:16px;text-align:center;">
      <p style="color:#fff;margin:0;font-size:12px;">Global Fertility Research | London, United Kingdom | Company No: 17263260</p>
      <p style="color:#aaa;margin:4px 0 0;font-size:11px;">contact@fertility-global.org | fertility-global.org</p>
    </div>
  </div>`
}

const templates = {
  registration: (name) => ({
    subject: 'Application Received — Global Fertility Research',
    html: wrap(`
      <h2 style="color:#0B2E5C;">Application Received</h2>
      <p>Dear Dr. ${name},</p>
      <p>Thank you for applying to join <strong>Global Fertility Research</strong>.</p>
      <p>Your application and documents have been received and are now under review by our administration team. You will be notified by email once your membership is approved.</p>
      <p>We appreciate your interest in advancing fertility science worldwide.</p>
      <p style="margin-top:24px;">Best regards,<br><strong>Global Fertility Research</strong></p>
    `),
  }),
  approved: (name) => ({
    subject: 'Welcome — Your Membership is Approved',
    html: wrap(`
      <h2 style="color:#1A8FA8;">🎉 Membership Approved</h2>
      <p>Dear Dr. ${name},</p>
      <p>We are pleased to inform you that your membership application to <strong>Global Fertility Research</strong> has been <strong style="color:#27ae60;">approved</strong>.</p>
      <p>You can now log in to your account to:</p>
      <ul>
        <li>Download your official Membership Certificate</li>
        <li>Request invitation letters for conferences</li>
        <li>Access the members' directory</li>
        <li>Share your activities and research</li>
      </ul>
      <p style="text-align:center;margin:28px 0;">
        <a href="https://fertility-global.org" style="background:#1A8FA8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Log In to Your Account</a>
      </p>
      <p>Welcome to our global community of medical professionals.</p>
      <p style="margin-top:24px;">Best regards,<br><strong>Mohammed Khayyat</strong><br>President, Global Fertility Research</p>
    `),
  }),
  rejected: (name, reason) => ({
    subject: 'Application Status — Global Fertility Research',
    html: wrap(`
      <h2 style="color:#0B2E5C;">Application Status</h2>
      <p>Dear Dr. ${name},</p>
      <p>Thank you for your interest in joining Global Fertility Research.</p>
      <p>After careful review, we regret to inform you that your membership application was not approved at this time.</p>
      ${reason ? `<div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px 16px;margin:16px 0;border-radius:4px;"><strong>Reason:</strong> ${reason}</div>` : ''}
      <p>If you believe this was in error or wish to provide additional information, please contact us at contact@fertility-global.org.</p>
      <p style="margin-top:24px;">Best regards,<br><strong>Global Fertility Research</strong></p>
    `),
  }),
  invitation: (name, conferenceTitle, invNumber) => ({
    subject: `Your Invitation Letter — ${conferenceTitle}`,
    html: wrap(`
      <h2 style="color:#1A8FA8;">Your Invitation is Ready</h2>
      <p>Dear Dr. ${name},</p>
      <p>An official invitation letter has been issued for you to attend:</p>
      <div style="background:#EBF4F8;padding:16px;border-radius:8px;margin:16px 0;">
        <strong style="color:#0B2E5C;font-size:16px;">${conferenceTitle}</strong><br>
        <span style="color:#666;">Reference: ${invNumber}</span>
      </div>
      <p>You can download your invitation letter by logging into your account:</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="https://fertility-global.org" style="background:#1A8FA8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Download Invitation</a>
      </p>
      <p>The invitation letter includes a QR code for verification. You may present this letter for visa and travel purposes.</p>
      <p style="font-size:13px;color:#888;">Note: Global Fertility Research is not responsible for visa decisions made by any authority.</p>
      <p style="margin-top:24px;">Best regards,<br><strong>Mohammed Khayyat</strong><br>President, Global Fertility Research</p>
    `),
  }),
}

async function send(to, template) {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'YOUR_RESEND_API_KEY_HERE') {
    console.warn('Resend API key not set — email skipped')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.warn('Email failed:', err)
      return false
    }
    return true
  } catch (err) {
    console.warn('Email error:', err.message)
    return false
  }
}

export const notifyRegistration = (to, name) =>
  send(to, templates.registration(name || 'Member'))

export const notifyApproved = (to, name) =>
  send(to, templates.approved(name || 'Member'))

export const notifyRejected = (to, name, reason) =>
  send(to, templates.rejected(name || 'Member', reason || ''))

export const notifyInvitation = (to, name, conferenceTitle, invNumber) =>
  send(to, templates.invitation(name || 'Member', conferenceTitle || 'Conference', invNumber || ''))
