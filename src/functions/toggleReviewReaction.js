import { supabase } from '@/lib/supabaseClient';
export async function toggleReviewReaction({ review_id, user_email, reaction_type } = {}) {
  const { data: existing } = await supabase
    .from('review_reactions')
    .select('id')
    .eq('review_id', review_id)
    .eq('user_email', user_email)
    .single();
  if (existing) {
    await supabase.from('review_reactions').delete().eq('id', existing.id);
    return { data: { action: 'removed' } };
  }
  const { data } = await supabase
    .from('review_reactions')
    .insert({ review_id, user_email, reaction_type })
    .select().single();
  return { data: { action: 'added', reaction: data } };
}
