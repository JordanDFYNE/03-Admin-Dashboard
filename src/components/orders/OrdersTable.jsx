import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrdersTable = ({ items, searchTerm, onSearchChange, loading }) => {
  return (
    <motion.div
      className="rounded-xl border border-gray-700 bg-gray-800 bg-opacity-50 p-6 shadow-lg backdrop-blur-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Ordered Consumables</h2>
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <input
            type="text"
            placeholder="Search ordered items"
            className="w-full rounded-lg bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:py-2"
            onChange={(event) => onSearchChange(event.target.value)}
            value={searchTerm}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Consumable
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Qty On Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Ordered At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Estimate Left
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-300" colSpan={6}>
                  Loading ordered consumables...
                </td>
              </tr>
            ) : items.length ? (
              items.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-100">
                    <div className="flex flex-col">
                      <Link
                        to={`/products/${order.id}`}
                        className="transition hover:text-white hover:underline"
                      >
                        {order.name}
                      </Link>
                      <span className="text-xs text-gray-500">{order.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {order.supplier_name || order.contact_for_reorder || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{order.quantity_on_order}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{order.ordered_at || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {order.days_remaining === null ? '-' : `${order.days_remaining} days`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        order.order_status === 'Overdue'
                          ? 'bg-red-500/20 text-red-300'
                          : order.order_status === 'Due today'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {order.order_status}
                    </span>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-400" colSpan={6}>
                  No ordered consumables found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default OrdersTable;
