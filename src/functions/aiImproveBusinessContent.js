import { base44 } from '@/api/base44Client';
export async function aiImproveBusinessContent(params) {
  return base44.functions.invoke('ai-improve-business-content', params);
}
