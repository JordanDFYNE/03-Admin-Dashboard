import { useEffect, useMemo, useState } from 'react';
import { fetchOrders, fetchOrderSummary } from '../lib/api.js';

export function useOrdersData(search) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const [orderItems, summaryPayload] = await Promise.all([
          fetchOrders(search),
          fetchOrderSummary(),
        ]);

        if (!active) return;

        setItems(orderItems);
        setSummary(summaryPayload);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message);
        setItems([]);
        setSummary(null);
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

  return useMemo(() => ({ items, summary, loading, error }), [items, summary, loading, error]);
}
