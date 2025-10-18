import { createClient } from '@supabase/supabase-js';

// FIX: Use process.env to access environment variables. This resolves a TypeScript error
// with import.meta.env and aligns with the pattern used in other services.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // A more user-friendly error message for the developer
    const errorMessage = "Supabase environment variables are not set. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.";
    console.error(errorMessage);
    // Render an error message in the UI
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif; background-color: #FFF0F0; border: 1px solid #FFC0C0;"><h2>Configuration Error</h2><p>${errorMessage}</p></div>`;
    }
    throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);