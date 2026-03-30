import { base44 } from '@/api/base44Client';
export async function openAiPing(params) {
  return base44.functions.invoke('openai-ping', params);
}
