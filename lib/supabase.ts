import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://nvnykdzmshpwcevipkdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bnlrZHptc2hwd2Nldmlwa2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzg3MTMsImV4cCI6MjA4NTgxNDcxM30.wRhhTppNxyFA_eR8atNhc9DG38A4Eg381gYAzfnn88w';

// Check if keys are valid
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

if (!supabase) {
  console.warn("%c Supabase Not Connected! ", "background: #f59e0b; color: black; padding: 4px; border-radius: 4px; font-weight: bold;");
  console.log("Running in local Mock Mode. Data will not be saved to the database.");
} else {
  console.log("%c Supabase Connected ", "background: #10b981; color: white; padding: 4px; border-radius: 4px; font-weight: bold;");
}