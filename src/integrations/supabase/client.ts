
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mfqnhbhxdqzyqkrevagh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcW5oYmh4ZHF6eXFrcmV2YWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDU5MjcsImV4cCI6MjA2MzMyMTkyN30.06thTTK3r3UR5fUK4imIOrpP0DmHsxD9nt3RF95Do4w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
