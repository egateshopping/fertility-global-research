// Detects profiles whose full_name is only the email-prefix placeholder written
// by the signup trigger when the real name never reached the database.
// Such a row must never be shown as if it were a real doctor's name.

export function isPlaceholderName(record) {
  if (!record) return false
  const name = String(record.full_name || '').trim()
  if (!name) return true
  const email = String(record.email || '').trim()
  if (!email) return false
  return name.toLowerCase() === email.split('@')[0].toLowerCase()
}

// Safe label for lists, exports and PDFs.
export function safeName(record, fallback = 'Name not recorded') {
  return isPlaceholderName(record) ? fallback : String(record.full_name || '').trim()
}
