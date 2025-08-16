import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced environment variable validation for Vercel
console.log('Environment check:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    VITE_SUPABASE_URL: SUPABASE_URL ? 'Set' : 'Not set',
    VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    // Log partial URL for debugging (without exposing full key)
    SUPABASE_URL_PARTIAL: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'Not set'
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const error = `Missing Supabase environment variables. 
    VITE_SUPABASE_URL: ${SUPABASE_URL ? 'Set' : 'Not set'}
    VITE_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
    
    Please check your Vercel environment variables configuration.`;
    
    console.error(error);
    throw new Error(error);
}

// Validate URL format
try {
    new URL(SUPABASE_URL);
} catch (urlError) {
    const errorMsg = `Invalid SUPABASE_URL format: ${SUPABASE_URL}`;
    console.error(errorMsg, urlError);
    throw new Error(errorMsg);
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    db: {
        schema: 'public'
    }
});

export default supabaseClient;