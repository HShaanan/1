import { supabase } from "@/lib/supabaseClient";

export async function aiImproveBusinessContent(params) {
  const { data, error } = await supabase.functions.invoke("aiImproveBusinessContent", { body: params });
  if (error) throw error;
  return data;
}
