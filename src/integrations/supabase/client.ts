// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zqkrfilytpmrpboyzwou.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxa3JmaWx5dHBtcnBib3l6d291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MTc5MzIsImV4cCI6MjA2NDE5MzkzMn0.PmUclidHbeqO2eAeNTnEmpWIUEiYp0D7816jslC1XGY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);