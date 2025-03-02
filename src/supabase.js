import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gdertcexvetgghwaqzhr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZXJ0Y2V4dmV0Z2dod2FxemhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MDUwNjQsImV4cCI6MjA1NjE4MTA2NH0.qaZsS_3vXwFY_1UcL_ncCPD-oJ7Ep-Q-0RVmHWyYYCo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
