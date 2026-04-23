import { motion } from 'framer-motion';
import { Barcode, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 10;

const ProductsTable = ({ items, searchTerm, onSearchChange, loading }) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return items.slice(startIndex, startIndex + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <motion.div
      className="mb-6 rounded-xl border border-gray-700 bg-gray-800 bg-opacity-50 p-4 shadow-lg backdrop-blur-md lg:mb-8 lg:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Product List</h2>
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <input
            type="text"
            placeholder="Search consumables"
            className="w-full rounded-lg bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:py-2"
            onChange={(event) => onSearchChange(event.target.value)}
            value={searchTerm}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Unit Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Barcode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Reorder Point
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Last 7 Days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-300" colSpan={6}>
                  Loading consumables...
                </td>
              </tr>
            ) : items.length ? (
              paginatedItems.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <span className="text-xs text-gray-500">{product.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {product.unit_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Barcode size={16} className="text-gray-500" />
                      <span>{product.barcode_value || 'Pending'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {Number(product.total_qty).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      {Number(product.total_qty) <= Number(product.reorder_point) ? (
                        <TriangleAlert size={16} className="text-amber-400" />
                      ) : null}
                      <span>{Number(product.reorder_point).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {Number(product.last_7_day_usage || 0).toLocaleString()}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-400" colSpan={6}>
                  No consumables match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-gray-700 bg-slate-900/40 p-4 text-sm text-gray-300">
            Loading consumables...
          </div>
        ) : items.length ? (
          paginatedItems.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-gray-700 bg-slate-900/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{product.sku}</p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {product.unit_type}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Barcode</p>
                  <p className="mt-1 break-all">{product.barcode_value || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Available</p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {Number(product.total_qty).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Reorder Point</p>
                  <p className="mt-1">{Number(product.reorder_point).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Last 7 Days</p>
                  <p className="mt-1">{Number(product.last_7_day_usage || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-gray-700 bg-slate-900/40 p-4 text-sm text-gray-400">
            No consumables match this search.
          </div>
        )}
      </div>

      {!loading && items.length ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-gray-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, items.length)} of{' '}
            {items.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="min-w-20 text-center text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default ProductsTable;
