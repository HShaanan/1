import { supabase } from "@/lib/supabaseClient";

export async function analyzeReview(params) {
  const { data, error } = await supabase.functions.invoke("analyzeReview", { body: params });
  if (error) throw error;
  return data;
}
