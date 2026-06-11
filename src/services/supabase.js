import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://vmsytelpgvszhwiitugt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtc3l0ZWxwZ3Zzemh3aWl0dWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3ODA3NzMsImV4cCI6MjA5MTM1Njc3M30.TpczYo52f3l0RmlPXuMw3wMNRFFiSXA0ZkuYlZ3Z8UA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', 
  },
});
