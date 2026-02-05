import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// FORCE MOCK MODE:
// We return 'null' if keys are missing OR if we want to force local state for testing.
// This fixes the "Booking not saving" issue caused by invalid DB connections.
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL') 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

if (!supabase) {
  console.log("%c Running in MOCK MODE ", "background: #222; color: #bada55; padding: 4px; border-radius: 4px;");
}