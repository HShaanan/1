import { supabase } from "@/lib/supabaseClient";

export async function toggleReviewReaction(params) {
  const { data, error } = await supabase.functions.invoke("toggleReviewReaction", { body: params });
  if (error) throw error;
  return data;
}
