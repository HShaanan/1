import { supabase } from "@/lib/supabaseClient";

export async function getIsraelTime(params) {
  const { data, error } = await supabase.functions.invoke("getIsraelTime", { body: params });
  if (error) throw error;
  return data;
}
