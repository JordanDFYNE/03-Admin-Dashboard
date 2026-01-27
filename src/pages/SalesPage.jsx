import Header from '../components/common/Header.jsx';
import { motion } from 'framer-motion';
import StatCard from '../components/common/StatCard.jsx';
import { TrendingUp, ShoppingCart, CreditCard, DollarSign } from 'lucide-react';
import SalesOverviewChart from '../components/sales/SalesOverviewChart.jsx';
import SalesByCategoryChart from '../components/sales/SalesByCategoryChart.jsx';
import DailySalesTrend from '../components/sales/DailySalesTrend.jsx';

const salesStats = {
  totalRevenue: '$1250000',
  averageOrderValue: '$75.5',
  conversionRate: '4%',
  SalesGrowth: '12%',
};

const SalesPage = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Sales Dashboard" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Sales Stats */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Revenue "
            icons={DollarSign}
            value={salesStats.totalRevenue.toLocaleString()}
            color="#6366f1"
          />
          <StatCard
            name="Average Order Value"
            icons={ShoppingCart}
            value={salesStats.averageOrderValue}
            color="#10b981"
          />
          <StatCard
            name="Conversion Rate"
            icons={TrendingUp}
            value={salesStats.conversionRate.toLocaleString()}
            color="#f59e0b"
          />
          <StatCard
            name="Sales Growth"
            icons={CreditCard}
            value={salesStats.SalesGrowth}
            color="#ef4444"
          />
        </motion.div>

        <SalesOverviewChart />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          <SalesByCategoryChart />
          <DailySalesTrend />
        </div>
      </main>
    </div>
  );
};

export default SalesPage;
