// Membership validity — one year from the member's joining date, renewed on
// each anniversary. Replaces the old rule of "valid until 31 December of the
// year of issue", and matches exactly what the public verification page shows,
// so the printed certificate and the QR result can never disagree.

// doctor.membership_start is the official joining date held in the database.
// Falls back to the issue date when a record predates that column.
export function membershipExpiry(doctor, issuedDate = new Date()) {
  const issued = issuedDate instanceof Date ? issuedDate : new Date(issuedDate)
  const startRaw = doctor?.membership_start || issued
  const start = startRaw instanceof Date ? startRaw : new Date(startRaw)

  // First anniversary of the joining date that falls on or after the issue date.
  const expiry = new Date(start)
  expiry.setFullYear(start.getFullYear() + 1)
  while (expiry < issued) {
    expiry.setFullYear(expiry.getFullYear() + 1)
  }
  return expiry
}

// "7 July 2027" — the wording used on the certificate.
export function formatExpiry(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

// Convenience: the full sentence printed on the certificate.
export function validityLine(doctor, issuedDate = new Date()) {
  return `This membership is valid until ${formatExpiry(membershipExpiry(doctor, issuedDate))}.`
}
