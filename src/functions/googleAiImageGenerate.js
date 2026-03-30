import { base44 } from '@/api/base44Client';
export async function googleAiImageGenerate(params) {
  return base44.functions.invoke('google-ai-image-generate', params);
}
