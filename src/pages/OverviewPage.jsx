import Header from '../components/common/Header.jsx';
import { motion } from 'framer-motion';
import { BarChart2, Zap, ShoppingBag, Users } from 'lucide-react';
import StatCard from '../components/common/StatCard.jsx';
import SalesOverviewChart from '../components/overview/SalesOverviewChart.jsx';
import CategoryDistributionChart from '../components/overview/CategoryDistributionChart.jsx';
import SalesChannelChart from '../components/overview/SalesChannelChart.jsx';

const OverviewPage = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Overview" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard name="Total Sales" icons={Zap} value="$12,345" color="#6366F1" />
          <StatCard name="New Users" icons={Users} value="1,234" color="#885cf6" />
          <StatCard name="Total Products" icons={ShoppingBag} value="567" color="#ec4899" />
          <StatCard name="Conversion Rate" icons={BarChart2} value="$12,345" color="#10b981" />
        </motion.div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SalesOverviewChart />
          <CategoryDistributionChart />
          <SalesChannelChart />
        </div>
      </main>
    </div>
  );
};
export default OverviewPage;
