import { base44 } from '@/api/base44Client';
export async function seedProfessionalSubcategoryImages(params) {
  return base44.functions.invoke('seed-professional-images', params);
}
