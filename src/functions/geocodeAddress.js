import { supabase } from "@/lib/supabaseClient";

export async function geocodeAddress(params) {
  const { data, error } = await supabase.functions.invoke("geocodeAddress", { body: params });
  if (error) throw error;
  return data;
}
