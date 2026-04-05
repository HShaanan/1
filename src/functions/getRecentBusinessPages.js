import { supabase } from "@/lib/supabaseClient";

export async function getRecentBusinessPages(params) {
  const { data, error } = await supabase.functions.invoke("getRecentBusinessPages", { body: params });
  if (error) throw error;
  return data;
}
