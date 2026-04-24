import { useEffect, useMemo, useState } from 'react';
import {
  archiveConsumable,
  fetchConsumables,
  fetchConsumablesSummary,
  updateConsumable,
} from '../lib/api.js';

export function useConsumablesData(search) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [usageTrend, setUsageTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    const [consumableItems, summaryPayload] = await Promise.all([
      fetchConsumables(search),
      fetchConsumablesSummary(),
    ]);

    setItems(Array.isArray(consumableItems) ? consumableItems : []);
    setSummary(summaryPayload?.summary ?? null);
    setCategories(Array.isArray(summaryPayload?.categories) ? summaryPayload.categories : []);
    setUsageTrend(Array.isArray(summaryPayload?.usageTrend) ? summaryPayload.usageTrend : []);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        if (!active) return;
        await refresh();
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message);
        setItems([]);
        setSummary(null);
        setCategories([]);
        setUsageTrend([]);
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
      refresh,
      updateItem: async (id, payload) => {
        await updateConsumable(id, payload);
        await refresh();
      },
      archiveItem: async (id) => {
        await archiveConsumable(id);
        await refresh();
      },
    }),
    [items, summary, categories, usageTrend, loading, error]
  );
}
