import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ntobivpywunyrdnfttsb.supabase.co'
const supabaseAnonKey = 'sb_publishable_1-oW5ELlkyxs0-pkS7ZIZA_ecnPLGq_'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
