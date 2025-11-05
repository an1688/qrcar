import { createClient } from '@supabase/supabase-js'

// 使用环境变量，如果没有则使用默认值（开发环境）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://djqofwresuytgmdbvqrw.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcW9md3Jlc3V5dGdtZGJ2cXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODg4MDAsImV4cCI6MjA3NzQ2NDgwMH0.Y_57Z2l-f49YpxfTmj1cX_9Tin9TNuxtv2LX0hOWD_U"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
