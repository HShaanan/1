import { supabase } from '@/lib/supabaseClient';
export async function getListingsNeedingCoordinates(_params) {
  const { data } = await supabase
    .from('businesses')
    .select('id, name, address, city')
    .is('latitude', null)
    .not('address', 'is', null)
    .limit(100);
  return { data: data || [] };
}
