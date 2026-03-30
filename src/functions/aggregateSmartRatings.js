import { supabase } from '@/lib/supabaseClient';
export async function aggregateSmartRatings({ business_page_id } = {}) {
  const query = supabase.from('reviews').select('rating');
  if (business_page_id) query.eq('business_page_id', business_page_id);
  const { data } = await query;
  const ratings = (data || []).map(r => r.rating).filter(Boolean);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return { data: { avg_rating: avg, count: ratings.length } };
}
