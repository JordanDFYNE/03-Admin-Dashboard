import { motion } from 'framer-motion';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const emptyFormState = {
  id: null,
  name: '',
  sku: '',
  unitType: '',
  locations: '',
  quantityAvailable: 0,
  contactForReorder: '',
  reorderPoint: 0,
  reorderQuantity: 0,
};

const ProductsTable = ({
  items,
  searchTerm,
  onSearchChange,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [page, setPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingItem, setEditingItem] = useState(emptyFormState);
  const [creatingItem, setCreatingItem] = useState(false);

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

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onUpdate(editingItem.id, {
        name: editingItem.name,
        unitType: editingItem.unitType,
        reorderPoint: Number(editingItem.reorderPoint || 0),
        reorderQuantity: Number(editingItem.reorderQuantity || 0),
      });
      setEditingItem(emptyFormState);
      toast.success('Consumable updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update consumable');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const locationNames = editingItem.locations
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          warehouseId: name.toLowerCase().includes('unit 3')
            ? 2
            : name.toLowerCase().includes('unit 4')
              ? 3
              : 1,
        }));

      await onCreate({
        sku: editingItem.sku,
        name: editingItem.name,
        unitType: editingItem.unitType,
        locations: locationNames,
        quantityAvailable: Number(editingItem.quantityAvailable || 0),
        contactForReorder: editingItem.contactForReorder,
        reorderPoint: Number(editingItem.reorderPoint || 0),
        reorderQuantity: Number(editingItem.reorderQuantity || 0),
      });

      setEditingItem(emptyFormState);
      setCreatingItem(false);
      toast.success('Consumable created');
    } catch (error) {
      toast.error(error.message || 'Failed to create consumable');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsSaving(true);

    try {
      await onDelete(deleteId);
      setDeleteId(null);
      toast.success('Consumable archived');
    } catch (error) {
      toast.error(error.message || 'Failed to archive consumable');
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(product) {
    setEditingItem({
      id: product.id,
      name: product.name,
      unitType: product.unit_type,
      reorderPoint: Number(product.reorder_point || 0),
      reorderQuantity: Number(product.default_reorder_qty || product.reorder_point || 0),
    });
  }

  return (
    <motion.div
      className="mb-6 rounded-xl border border-gray-700 bg-gray-800 bg-opacity-50 p-4 shadow-lg backdrop-blur-md lg:mb-8 lg:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Product List</h2>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px] sm:flex-row">
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
          <button
            type="button"
            onClick={() => {
              setCreatingItem(true);
              setEditingItem(emptyFormState);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 sm:py-2"
          >
            <Plus size={16} />
            Add
          </button>
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
                Locations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Quantity Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Reorder List
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-300" colSpan={7}>
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
                      <Link
                        to={`/products/${product.id}`}
                        className="transition hover:text-white hover:underline"
                      >
                        {product.name}
                      </Link>
                      <span className="text-xs text-gray-500">{product.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {product.unit_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className="block max-w-xs truncate">{product.locations}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {Number(product.total_qty).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span>{product.contact_for_reorder || product.supplier_name || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {product.reorder_list}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:bg-slate-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(product.id)}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-red-300 transition hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-400" colSpan={7}>
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
                  <Link
                    to={`/products/${product.id}`}
                    className="text-sm font-semibold text-white transition hover:text-slate-200 hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">{product.sku}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {product.unit_type}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-700"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(product.id)}
                    className="rounded-lg border border-red-500/40 p-2 text-red-300 transition hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Locations</p>
                  <p className="mt-1 break-words">{product.locations}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Quantity Available
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {Number(product.total_qty).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Contact</p>
                  <p className="mt-1 break-words">
                    {product.contact_for_reorder || product.supplier_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Reorder List</p>
                  <p className="mt-1">{product.reorder_list}</p>
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

      {creatingItem || editingItem.id ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {creatingItem ? 'Add consumable' : 'Update consumable'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(emptyFormState);
                  setCreatingItem(false);
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={creatingItem ? handleCreate : handleSave}>
              {creatingItem ? (
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block">SKU</span>
                  <input
                    type="text"
                    value={editingItem.sku}
                    onChange={(event) =>
                      setEditingItem((current) => ({ ...current, sku: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                  />
                  <span className="mt-2 block text-xs text-slate-500">Optional</span>
                </label>
              ) : null}

              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Name</span>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(event) =>
                    setEditingItem((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                />
              </label>

              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Unit Type</span>
                <input
                  type="text"
                  value={editingItem.unitType}
                  onChange={(event) =>
                    setEditingItem((current) => ({ ...current, unitType: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                />
              </label>

              {creatingItem ? (
                <>
                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Locations</span>
                    <input
                      type="text"
                      value={editingItem.locations}
                      onChange={(event) =>
                        setEditingItem((current) => ({ ...current, locations: event.target.value }))
                      }
                      placeholder="Unit 1, Unit 3"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                    />
                  </label>

                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Quantity Available</span>
                    <input
                      type="number"
                      value={editingItem.quantityAvailable}
                      onChange={(event) =>
                        setEditingItem((current) => ({
                          ...current,
                          quantityAvailable: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                    />
                  </label>

                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Contact</span>
                    <input
                      type="text"
                      value={editingItem.contactForReorder}
                      onChange={(event) =>
                        setEditingItem((current) => ({
                          ...current,
                          contactForReorder: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                    />
                  </label>
                </>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block">Reorder Point</span>
                  <input
                    type="number"
                    value={editingItem.reorderPoint}
                    onChange={(event) =>
                      setEditingItem((current) => ({
                        ...current,
                        reorderPoint: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                  />
                  {creatingItem ? (
                    <span className="mt-2 block text-xs text-slate-500">Optional</span>
                  ) : null}
                </label>

                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block">Reorder Quantity</span>
                  <input
                    type="number"
                    value={editingItem.reorderQuantity}
                    onChange={(event) =>
                      setEditingItem((current) => ({
                        ...current,
                        reorderQuantity: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(emptyFormState);
                    setCreatingItem(false);
                  }}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : creatingItem ? 'Create consumable' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Archive consumable?</h3>
            <p className="mt-3 text-sm text-slate-400">
              This will remove the consumable from the active list but keep its history in the
              database.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default ProductsTable;
