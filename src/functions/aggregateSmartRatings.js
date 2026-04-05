import { supabase } from "@/lib/supabaseClient";

export async function aggregateSmartRatings(params) {
  const { data, error } = await supabase.functions.invoke("aggregateSmartRatings", { body: params });
  if (error) throw error;
  return data;
}
