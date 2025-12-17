import { useMemo } from 'react';
import Fuse from 'fuse.js';

export const useFuse = (list, searchTerm, keys) => {
  const fuse = useMemo(() => {
    return new Fuse(list, {
      keys,
      threshold: 0.3, // sensitivity: 0.0 is exact match, 1.0 is match anything
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }, [list, keys]);

  const results = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') return list;
    return fuse.search(searchTerm).map(result => result.item);
  }, [fuse, searchTerm, list]);

  return results;
};