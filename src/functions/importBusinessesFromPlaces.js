import { base44 } from '@/api/base44Client';
export async function importBusinessesFromPlaces(params) {
  return base44.functions.invoke('import-businesses-from-places', params);
}
