import { supabase } from '@/lib/supabaseClient';
export async function getMyReviewReaction({ review_id, user_email } = {}) {
  const { data } = await supabase
    .from('review_reactions')
    .select('*')
    .eq('review_id', review_id)
    .eq('user_email', user_email)
    .single();
  return { data };
}
