import { supabase } from '@/lib/supabaseClient';
export async function manuallyAssignOwner({ listing_id, owner_email } = {}) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ business_owner_email: owner_email })
    .eq('id', listing_id)
    .select()
    .single();
  if (error) throw error;
  return { data };
}
