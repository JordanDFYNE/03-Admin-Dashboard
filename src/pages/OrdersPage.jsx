import Header from '../components/common/Header.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { ShoppingBag, Clock, AlertTriangle, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import OrdersTable from '../components/orders/OrdersTable.jsx';
import { useOrdersData } from '../hooks/useOrdersData.js';

const OrdersPage = () => {
  const [search, setSearch] = useState('');
  const { items, summary, loading, error } = useOrdersData(search);

  const onOrderQuantity = useMemo(
    () => Number(summary?.quantity_on_order || 0).toLocaleString(),
    [summary]
  );

  return (
    <div className="relative z-10">
      <Header title="Order" />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <motion.div
          className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Orders"
            icons={ShoppingBag}
            value={summary?.total_orders ?? (loading ? '...' : 0)}
            color="#6366F1"
          />
          <StatCard
            name="Active Orders"
            icons={Clock}
            value={summary?.active_orders ?? (loading ? '...' : 0)}
            color="#F59E0B"
          />
          <StatCard
            name="Overdue"
            icons={AlertTriangle}
            value={summary?.overdue_orders ?? (loading ? '...' : 0)}
            color="#EF4444"
          />
          <StatCard name="Qty On Order" icons={Package} value={onOrderQuantity} color="#10B981" />
        </motion.div>

        {error ? (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <OrdersTable
          items={items}
          searchTerm={search}
          onSearchChange={setSearch}
          loading={loading}
        />
      </main>
    </div>
  );
};

export default OrdersPage;
