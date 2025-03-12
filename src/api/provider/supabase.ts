import { createClient } from "@supabase/supabase-js";
import { Database } from "../model";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
console.log("ENCS Supabase: ",supabaseUrl, supabaseKey);

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
