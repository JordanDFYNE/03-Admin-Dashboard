import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';

export function useOverviewData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const payload = await apiRequest('/reports/overview');

        if (!active) return;
        setData(payload);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message);
        setData(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}
