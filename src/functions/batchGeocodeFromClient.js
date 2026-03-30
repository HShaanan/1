import { geocodeAddress } from './geocodeAddress';
export async function batchGeocodeFromClient({ addresses = [] } = {}) {
  const results = await Promise.all(addresses.map(address => geocodeAddress({ address })));
  return { data: results.map(r => r.data) };
}
