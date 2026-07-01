import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cdhbjunyzrtvfewztohj.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_TLt4fXVc8XxIYsq0erc2_Q_6Yfv6-l8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const uploadFile = async (bucket, filePath, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true })

  if (error) throw error
  return data
}

export const getPublicUrl = (bucket, filePath) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

export const generateInvitationNumber = () => {
  const year = new Date().getFullYear()
  // Use timestamp (last 5 digits) + random 2 digits = virtually impossible to duplicate
  const ts = Date.now() % 100000
  const rnd = Math.floor(10 + Math.random() * 90)
  return `FGR-${ts}${rnd}-${year}`
}
