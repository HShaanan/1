import { supabase } from "@/lib/supabaseClient";

export async function getGoogleMapsKey(params) {
  const { data, error } = await supabase.functions.invoke("getGoogleMapsKey", { body: params });
  if (error) throw error;
  return data;
}
