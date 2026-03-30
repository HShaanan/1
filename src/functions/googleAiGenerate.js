import { base44 } from '@/api/base44Client';
export async function googleAiGenerate(params) {
  return base44.functions.invoke('google-ai-generate', params);
}
