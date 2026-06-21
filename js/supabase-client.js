// js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://zauyayrcrywazucdvmia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdXlheXJjcnl3YXp1Y2R2bWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzMyNDMsImV4cCI6MjA5NzYwOTI0M30.BS-QCXTm5WDsevO2evSZPndIRhIGBeaAuF1opDY_7a4";

// Congelamos el cliente para evitar manipulaciones en caliente (OWASP Client-Side Tampering)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
Object.freeze(supabase);


