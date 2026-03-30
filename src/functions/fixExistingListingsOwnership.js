import { base44 } from '@/api/base44Client';
export async function fixExistingListingsOwnership(params) {
  return base44.functions.invoke('fix-listings-ownership', params);
}
