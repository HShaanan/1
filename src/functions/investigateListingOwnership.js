import { supabase } from '@/lib/supabaseClient';
export async function investigateListingOwnership({ listing_id } = {}) {
  const { data } = await supabase
    .from('businesses')
    .select('id, name, business_owner_email')
    .eq('id', listing_id)
    .single();
  return { data };
}
