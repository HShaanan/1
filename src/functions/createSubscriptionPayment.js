import { supabase } from "@/lib/supabaseClient";

export async function createSubscriptionPayment(params) {
  const { data, error } = await supabase.functions.invoke("createSubscriptionPayment", { body: params });
  if (error) throw error;
  return data;
}
