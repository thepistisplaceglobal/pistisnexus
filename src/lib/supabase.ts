import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://fuvoeldcvfydomuawwwv.supabase.co';
const supabaseAnonKey = (envKey && envKey.length > 10) ? envKey : 'sb_publishable_wgZMU0MP8wvyHFxa-zluwA_t34NBXAY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
