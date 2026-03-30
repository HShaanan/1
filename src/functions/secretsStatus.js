import { base44 } from '@/api/base44Client';
export async function secretsStatus(params) {
  return base44.functions.invoke('secrets-status', params);
}
