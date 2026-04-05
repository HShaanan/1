import { supabase } from "@/lib/supabaseClient";

export async function getListingsNeedingCoordinates(params) {
  const { data, error } = await supabase.functions.invoke("getListingsNeedingCoordinates", { body: params });
  if (error) throw error;
  return data;
}
