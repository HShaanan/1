import { supabase } from "@/lib/supabaseClient";

export async function batchGeocodeFromClient(params) {
  const { data, error } = await supabase.functions.invoke("batchGeocodeFromClient", { body: params });
  if (error) throw error;
  return data;
}
