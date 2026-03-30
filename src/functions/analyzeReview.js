import { base44 } from '@/api/base44Client';
export async function analyzeReview(params) {
  return base44.functions.invoke('analyze-review', params);
}
