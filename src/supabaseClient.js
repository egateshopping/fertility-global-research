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
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `FGR-${timestamp}-${random}`
}
