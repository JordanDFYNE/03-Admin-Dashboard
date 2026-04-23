import Header from '../components/common/Header.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownUp, Boxes, Package } from 'lucide-react';
import { useMemo, useState } from 'react';
import CategoryDistributionChart from '../components/overview/CategoryDistributionChart.jsx';
import ProductsTable from '../components/products/ProductsTable.jsx';
import SalesTrendChart from '../components/products/SalesTrendChart.jsx';
import { useConsumablesData } from '../hooks/useConsumablesData.js';

const ProductsPage = () => {
  const [search, setSearch] = useState('');
  const { items, summary, categories, usageTrend, loading, error } = useConsumablesData(search);

  const stockValue = useMemo(() => {
    if (!summary?.stock_value) return '0';
    return Number(summary.stock_value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [summary]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Consumables Inventory" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Consumables"
            icons={Package}
            value={summary?.total_consumables ?? (loading ? '...' : 0)}
            color="#6366F1"
          />
          <StatCard
            name="Low Stock"
            icons={AlertTriangle}
            value={summary?.low_stock_count ?? (loading ? '...' : 0)}
            color="#F59E0B"
          />
          <StatCard
            name="Items On Order"
            icons={ArrowDownUp}
            value={summary?.on_order_count ?? (loading ? '...' : 0)}
            color="#10B981"
          />
          <StatCard name="Stock Value" icons={Boxes} value={`$${stockValue}`} color="#EF4444" />
        </motion.div>

        {error ? (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <ProductsTable
          items={items}
          searchTerm={search}
          onSearchChange={setSearch}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SalesTrendChart data={usageTrend} />
          <CategoryDistributionChart data={categories} />
        </div>
      </main>
    </div>
  );
};
export default ProductsPage;
