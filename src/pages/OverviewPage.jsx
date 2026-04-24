import Header from '../components/common/Header.jsx';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Boxes, ClipboardList, Package, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/common/StatCard.jsx';
import { useOverviewData } from '../hooks/useOverviewData.js';

const severityStyles = {
  critical: 'border-red-500/30 bg-red-500/10 text-red-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
};

const quickActions = [
  {
    name: 'Add Consumable',
    href: '/products',
    icon: Package,
    color: 'bg-emerald-500 text-slate-950',
  },
  {
    name: 'Open Scan',
    href: '/scan',
    icon: ScanLine,
    color: 'bg-blue-500 text-white',
  },
  {
    name: 'View Orders',
    href: '/orders',
    icon: ClipboardList,
    color: 'bg-amber-500 text-slate-950',
  },
];

const OverviewPage = () => {
  const { data, loading, error } = useOverviewData();

  const summary = data?.summary;
  const urgentActions = data?.urgentActions || [];
  const locationSummary = data?.locationSummary || [];

  return (
    <div className="relative z-10">
      <Header title="Overview" />

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <motion.div
          className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Consumables"
            icons={Package}
            value={summary?.consumable_count ?? (loading ? '...' : 0)}
            color="#6366F1"
          />
          <StatCard
            name="Low Stock"
            icons={AlertTriangle}
            value={summary?.low_stock_count ?? (loading ? '...' : 0)}
            color="#F59E0B"
          />
          <StatCard
            name="Ordered Items"
            icons={ClipboardList}
            value={summary?.ordered_count ?? (loading ? '...' : 0)}
            color="#10B981"
          />
          <StatCard
            name="Qty On Order"
            icons={Boxes}
            value={
              summary
                ? Number(summary.quantity_on_order || 0).toLocaleString()
                : loading
                  ? '...'
                  : 0
            }
            color="#EF4444"
          />
        </motion.div>

        {error ? (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 shadow-lg backdrop-blur-md xl:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Urgent Actions</h2>
              <span className="text-sm text-slate-400">Priority list</span>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-300">Loading urgent actions...</p>
              ) : urgentActions.length ? (
                urgentActions.map((action) => (
                  <Link
                    key={`${action.action_type}-${action.id}`}
                    to={action.href}
                    className={`flex items-center justify-between rounded-2xl border p-4 transition hover:bg-slate-800 ${severityStyles[action.severity] || severityStyles.info}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{action.name}</p>
                      <p className="mt-1 text-sm opacity-90">{action.detail}</p>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400">No urgent actions right now.</p>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 shadow-lg backdrop-blur-md"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  to={action.href}
                  className={`flex items-center justify-between rounded-2xl px-4 py-4 text-sm font-semibold transition hover:opacity-90 ${action.color}`}
                >
                  <span className="flex items-center gap-3">
                    <action.icon size={18} />
                    {action.name}
                  </span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 shadow-lg backdrop-blur-md xl:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">By Location</h2>
              <span className="text-sm text-slate-400">Unit visibility</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <p className="text-sm text-slate-300">Loading location summary...</p>
              ) : locationSummary.length ? (
                locationSummary.map((location) => (
                  <div
                    key={location.unit_name}
                    className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4"
                  >
                    <p className="text-base font-semibold text-white">{location.unit_name}</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      {Number(location.total_qty).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {location.consumable_count} consumables stored
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No location summary available.</p>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 shadow-lg backdrop-blur-md"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Warehouse Health</h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
                <p className="text-slate-400">Total units tracked</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {summary
                    ? Number(summary.total_units || 0).toLocaleString()
                    : loading
                      ? '...'
                      : 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
                <p className="text-slate-400">Active stock locations</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {summary?.active_location_count ?? (loading ? '...' : 0)}
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default OverviewPage;
