import { useEffect, useMemo, useState } from 'react';
import { fetchConsumables, fetchConsumablesSummary } from '../lib/api.js';

export function useConsumablesData(search) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [usageTrend, setUsageTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const [consumableItems, summaryPayload] = await Promise.all([
          fetchConsumables(search),
          fetchConsumablesSummary(),
        ]);

        if (!active) return;

        setItems(consumableItems);
        setSummary(summaryPayload.summary);
        setCategories(summaryPayload.categories);
        setUsageTrend(summaryPayload.usageTrend);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message);
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
  }, [search]);

  return useMemo(
    () => ({
      items,
      summary,
      categories,
      usageTrend,
      loading,
      error,
    }),
    [items, summary, categories, usageTrend, loading, error]
  );
}
