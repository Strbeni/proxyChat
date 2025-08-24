import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://annzjckhgoipbbolldoq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubnpqY2toZ29pcGJib2xsZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODExMTIsImV4cCI6MjA3MTQ1NzExMn0.bsOzB2VKzO-JTOPATqA54oBFbJkTiqEa8iHaWT3WRNI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
