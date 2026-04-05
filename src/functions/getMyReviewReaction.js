import { supabase } from "@/lib/supabaseClient";

export async function getMyReviewReaction(params) {
  const { data, error } = await supabase.functions.invoke("getMyReviewReaction", { body: params });
  if (error) throw error;
  return data;
}
