import { createClient } from "@supabase/supabase-js";
import { Database } from "../model";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log("ENCS Supabase: ", supabaseUrl, supabaseKey);

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
