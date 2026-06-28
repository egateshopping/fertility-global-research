import React from 'react'

export default function TermsPage() {
  return (
    <div className="terms-page">
      <div className="terms-header">
        <img src="/logo.png" alt="" className="terms-logo" />
        <h1>Terms & Conditions</h1>
        <p>Global Fertility Research — London, United Kingdom</p>
        <p className="terms-date">Last updated: June 2026</p>
      </div>

      <div className="terms-body">

        <section className="terms-section">
          <h2>1. About Us</h2>
          <p>Global Fertility Research is a British scientific organization based in London, United Kingdom. We specialize in fertility medicine research and advancing medical knowledge through international conferences, training, and collaboration among healthcare professionals worldwide.</p>
        </section>

        <section className="terms-section">
          <h2>2. Registration Requirements</h2>
          <p>By registering on this platform, you agree to:</p>
          <ul>
            <li>Provide accurate and truthful information in <strong>English</strong>, exactly as it appears on your official identification documents (passport, syndicate card).</li>
            <li>Enter your full name as stated on your passport.</li>
            <li>Keep your account information up to date.</li>
            <li>Not create multiple accounts or register on behalf of another person without authorization.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. Membership Approval</h2>
          <p>All registrations are subject to review and approval by the association's administration. You will be notified by email once your membership is approved. The association reserves the right to reject or revoke membership without obligation to provide a reason.</p>
        </section>

        <section className="terms-section">
          <h2>4. Visa & Travel — Disclaimer</h2>
          <p className="terms-important">
            ⚠️ <strong>Global Fertility Research is not responsible for any visa decisions made by embassies, consulates, or immigration authorities.</strong> Invitation letters issued by the association are provided solely to support conference attendance applications. Issuance of an invitation letter does not guarantee visa approval or entry into any country.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Directory & Information Sharing</h2>
          <p>By registering, you agree that your professional profile (name, specialty, hospital, city, and country) may be displayed in the association's public doctor directory. Your contact details and passport information will not be shared publicly and are used for administrative purposes only.</p>
        </section>

        <section className="terms-section">
          <h2>6. Privacy Policy</h2>
          <p>Your personal data is collected and processed solely for association administration and conference management purposes. We do not sell, rent, or share your personal information with third parties. Data is stored securely and accessed only by authorized association staff.</p>
        </section>

        <section className="terms-section">
          <h2>7. Membership Rights</h2>
          <p>Approved members are entitled to:</p>
          <ul>
            <li>Receive official conference invitation letters.</li>
            <li>Appear in the association's professional directory.</li>
            <li>Request a membership certificate.</li>
            <li>Participate in association conferences and events.</li>
          </ul>
          <p>Membership does not guarantee visa approval, travel funding, or any financial benefits.</p>
        </section>

        <section className="terms-section">
          <h2>8. Termination of Membership</h2>
          <p>The association reserves the right to suspend or terminate any membership if the member:</p>
          <ul>
            <li>Provides false or misleading information.</li>
            <li>Misuses the association's name or official documents.</li>
            <li>Violates these terms and conditions.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>9. Contact Us</h2>
          <p>For any questions regarding these terms, please contact us at:</p>
          <p><strong>Email:</strong> contact@fertility-global.org</p>
          <p><strong>Website:</strong> fertility-global.org</p>
          <p><strong>Address:</strong> London, United Kingdom</p>
        </section>

      </div>
    </div>
  )
}
