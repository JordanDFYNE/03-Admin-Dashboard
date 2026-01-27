import Header from '../components/common/Header.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { motion } from 'framer-motion';
import { AlertTriangle, DollarSign, TrendingUp, Package, Zap } from 'lucide-react';
import CategoryDistributionChart from '../components/overview/CategoryDistributionChart.jsx';
import ProductsTable from '../components/products/ProductsTable.jsx';
import SalesTrendChart from '../components/products/SalesTrendChart.jsx';

const ProductsPage = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Products" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard name="Total Products" icons={Package} value={1234} color="#6366F1" />
          <StatCard name="Top Selling" icons={TrendingUp} value={89} color="#10B981" />
          <StatCard name="Low Stock" icons={AlertTriangle} value={23} color="#F59E0B" />
          <StatCard name="Total Revenue" icons={DollarSign} value={'$543,210'} color="#EF4444" />
        </motion.div>

        <ProductsTable />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SalesTrendChart />
          <CategoryDistributionChart />
        </div>
      </main>
    </div>
  );
};
export default ProductsPage;
