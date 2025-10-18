
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = "Supabase environment variables are not set. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env.local file and that you have restarted your development server.";
    console.error(errorMessage);
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif; background-color: #FFF0F0; border: 1px solid #FFC0C0;"><h2>Configuration Error</h2><p>${errorMessage}</p></div>`;
    }
    throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);