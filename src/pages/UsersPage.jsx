import Header from '../components/common/Header.jsx';
import StatCard from '../components/common/StatCard.jsx';
import UsersTable from '../components/users/UsersTable.jsx';
import { motion } from 'framer-motion';
import { UserX, UserPlus, UserCheck, UsersIcon } from 'lucide-react';
import UserGrowthChart from '../components/users/UserGrowthChart.jsx';
import UserActivityHeatmap from '../components/users/UserActivityHeatmap.jsx';
import UserDemographicsChart from '../components/users/UserDemographicsChart.jsx';

const userStats = {
  totalUsers: 152845,
  newUsersToday: 243,
  activeUsers: 98520,
  churnRate: '2.4%',
};

const UsersPage = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Users" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Users"
            icons={UsersIcon}
            value={userStats.totalUsers.toLocaleString()}
            color="#6366f1"
          />
          <StatCard
            name="New Users Today"
            icons={UserPlus}
            value={userStats.newUsersToday}
            color="#10b981"
          />
          <StatCard
            name="Active Users"
            icons={UserCheck}
            value={userStats.activeUsers.toLocaleString()}
            color="#f59e0b"
          />
          <StatCard name="Churn Rate" icons={UserX} value={userStats.churnRate} color="#ef4444" />
        </motion.div>

        <UsersTable />

        {/* User Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <UserGrowthChart />
          <UserActivityHeatmap />
          <UserDemographicsChart />
        </div>
      </main>
    </div>
  );
};
export default UsersPage;
