import { useEffect, useMemo, useState } from 'react';
import { fetchConsumableDetail, updateConsumable } from '../lib/api.js';

export function useConsumableDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    const payload = await fetchConsumableDetail(id);
    setData(payload);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const payload = await fetchConsumableDetail(id);

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

    if (id) {
      load();
    }

    return () => {
      active = false;
    };
  }, [id]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
      updateItem: async (payload) => {
        await updateConsumable(id, payload);
        await refresh();
      },
    }),
    [data, loading, error, id]
  );
}
