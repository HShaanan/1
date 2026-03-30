import { supabase } from '@/lib/supabaseClient';
export async function getRecentBusinessPages({ limit = 10 } = {}) {
  const { data } = await supabase
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .order('created_date', { ascending: false })
    .limit(limit);
  return { data: data || [] };
}
