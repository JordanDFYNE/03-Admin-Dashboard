import { motion } from 'framer-motion';
import { ArrowLeft, Boxes, ClipboardList, MapPin, Package, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/common/Header.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { useConsumableDetail } from '../hooks/useConsumableDetail.js';
import { archiveConsumable } from '../lib/api.js';

const fieldRows = [
  ['SKU', 'sku'],
  ['Unit Type', 'unit_type'],
  ['Locations', 'locations'],
  ['Supplier', 'supplier_name'],
  ['Contact', 'contact_for_reorder'],
  ['Quantity On Order', 'quantity_on_order'],
  ['Estimated Delivery', 'estimated_delivery_date'],
  ['Unit Quantity', 'unit_quantity'],
  ['Unit Price', 'unit_price'],
  ['Qty Per Box/Pallet', 'qty_per_pack'],
  ['Production Time (Days)', 'production_time_days'],
  ['Transit Time', 'transit_time_text'],
  ['Min Order', 'min_order_qty'],
  ['Stock Status', 'stock_status'],
  ['Ordered?', 'ordered'],
  ['Default Reorder Point', 'default_reorder_point'],
  ['Default Reorder Qty', 'default_reorder_qty'],
  ['Tags', 'tags'],
  ['Notes', 'notes'],
];

const formatValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const Panel = ({ title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 shadow-lg backdrop-blur-md"
  >
    <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
    {children}
  </motion.section>
);

const toEditableValue = (item) => ({
  sku: item.sku || '',
  name: item.name || '',
  unit_type: item.unit_type || '',
  locations: item.locations === 'Unassigned' ? '' : item.locations || '',
  supplier_name: item.supplier_name || '',
  contact_for_reorder: item.contact_for_reorder || '',
  quantity_on_order: item.quantity_on_order || 0,
  estimated_delivery_date: item.estimated_delivery_date || '',
  unit_quantity: item.unit_quantity || 0,
  unit_price: item.unit_price || 0,
  qty_per_pack: item.qty_per_pack || 0,
  production_time_days: item.production_time_days || '',
  transit_time_text: item.transit_time_text || '',
  min_order_qty: item.min_order_qty || 0,
  stock_status: item.stock_status || 'ok',
  ordered: Boolean(item.ordered),
  reorder_point: item.reorder_point || 0,
  reorder_target: item.reorder_target || item.default_reorder_qty || 0,
  tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
  notes: item.notes || '',
});

const ConsumableDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, updateItem } = useConsumableDetail(id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState(null);

  const item = data?.item;

  useEffect(() => {
    if (item) {
      setFormValues(toEditableValue(item));
    }
  }, [item]);

  async function handleArchive() {
    if (!id) return;

    setIsDeleting(true);

    try {
      await archiveConsumable(id);
      toast.success('Consumable archived');
      navigate('/products');
    } catch (archiveError) {
      toast.error(archiveError.message || 'Failed to archive consumable');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleSave() {
    if (!item || !formValues) return;

    setIsSaving(true);

    try {
      await updateItem({
        sku: formValues.sku,
        name: formValues.name,
        unitType: formValues.unit_type,
        supplierName: formValues.supplier_name,
        sourceLocations: formValues.locations
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        contactForReorder: formValues.contact_for_reorder,
        quantityOnOrder: Number(formValues.quantity_on_order || 0),
        estimatedDeliveryDate: formValues.estimated_delivery_date,
        unitQuantity: Number(formValues.unit_quantity || 0),
        unitPrice: Number(formValues.unit_price || 0),
        qtyPerPack: Number(formValues.qty_per_pack || 0),
        productionTimeDays: formValues.production_time_days,
        transitTimeText: formValues.transit_time_text,
        minOrderQty: Number(formValues.min_order_qty || 0),
        stockStatus: formValues.stock_status,
        ordered: formValues.ordered,
        reorderPoint: Number(formValues.reorder_point || 0),
        reorderQuantity: Number(formValues.reorder_target || 0),
        tags: formValues.tags
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        notes: formValues.notes,
      });

      toast.success('Consumable updated');
      setIsEditing(false);
    } catch (saveError) {
      toast.error(saveError.message || 'Failed to update consumable');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    if (item) {
      setFormValues(toEditableValue(item));
    }
    setIsEditing(false);
  }

  const editableFields = [
    ['SKU', 'sku', 'text'],
    ['Unit Type', 'unit_type', 'text'],
    ['Locations', 'locations', 'text'],
    ['Supplier', 'supplier_name', 'text'],
    ['Contact', 'contact_for_reorder', 'text'],
    ['Quantity On Order', 'quantity_on_order', 'number'],
    ['Estimated Delivery', 'estimated_delivery_date', 'date'],
    ['Unit Quantity', 'unit_quantity', 'number'],
    ['Unit Price', 'unit_price', 'number'],
    ['Qty Per Box/Pallet', 'qty_per_pack', 'number'],
    ['Production Time (Days)', 'production_time_days', 'number'],
    ['Transit Time', 'transit_time_text', 'text'],
    ['Min Order', 'min_order_qty', 'number'],
    ['Stock Status', 'stock_status', 'text'],
    ['Ordered?', 'ordered', 'checkbox'],
    ['Default Reorder Point', 'reorder_point', 'number'],
    ['Default Reorder Qty', 'reorder_target', 'number'],
    ['Tags', 'tags', 'text'],
    ['Notes', 'notes', 'textarea'],
  ];

  return (
    <div className="relative z-10">
      <Header title={item?.name || 'Consumable Detail'} />

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            Back to stock
          </Link>

          {item ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
              >
                <Pencil size={16} />
                {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
              </button>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/20"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-slate-300">
            Loading consumable details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : item ? (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                name="Quantity Available"
                icons={Package}
                value={item.total_qty}
                color="#22c55e"
              />
              <StatCard
                name="Reorder Point"
                icons={ClipboardList}
                value={item.reorder_point}
                color="#f59e0b"
              />
              <StatCard name="Locations" icons={MapPin} value={item.locations} color="#60a5fa" />
              <StatCard
                name="Quantity On Order"
                icons={Boxes}
                value={item.quantity_on_order}
                color="#ef4444"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <Panel title="Consumable Details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(isEditing ? editableFields : fieldRows).map((field) => {
                      const [label, key, type = 'text', disabled = false] = field;

                      return (
                        <div
                          key={key}
                          className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                          {isEditing ? (
                            type === 'textarea' ? (
                              <textarea
                                value={formValues?.[key] ?? ''}
                                onChange={(event) =>
                                  setFormValues((current) => ({
                                    ...current,
                                    [key]: event.target.value,
                                  }))
                                }
                                disabled={disabled}
                                className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white disabled:opacity-50"
                              />
                            ) : type === 'checkbox' ? (
                              <label className="mt-3 inline-flex items-center gap-3 text-sm text-slate-100">
                                <input
                                  type="checkbox"
                                  checked={Boolean(formValues?.[key])}
                                  onChange={(event) =>
                                    setFormValues((current) => ({
                                      ...current,
                                      [key]: event.target.checked,
                                    }))
                                  }
                                  disabled={disabled}
                                />
                                <span>{Boolean(formValues?.[key]) ? 'Yes' : 'No'}</span>
                              </label>
                            ) : (
                              <input
                                type={type}
                                value={formValues?.[key] ?? ''}
                                onChange={(event) =>
                                  setFormValues((current) => ({
                                    ...current,
                                    [key]: event.target.value,
                                  }))
                                }
                                disabled={disabled}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white disabled:opacity-50"
                              />
                            )
                          ) : (
                            <p className="mt-2 text-sm text-slate-100">{formatValue(item[key])}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                <Panel title="Weekly Checks">
                  <div className="space-y-3">
                    {data.weeklyChecks.length ? (
                      data.weeklyChecks.map((check) => (
                        <div
                          key={`${check.check_date}-${check.location_code || 'none'}`}
                          className="grid gap-2 rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-200 sm:grid-cols-4"
                        >
                          <span>{check.check_date}</span>
                          <span>{check.location_name || check.location_code || '-'}</span>
                          <span>{check.counted_qty}</span>
                          <span className="text-slate-400">{check.notes || '-'}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No weekly checks found.</p>
                    )}
                  </div>
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel title="Location Stock">
                  <div className="space-y-3">
                    {data.locationStock.length ? (
                      data.locationStock.map((row) => (
                        <div
                          key={row.id}
                          className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-200"
                        >
                          <p className="font-medium text-white">{row.name || row.code}</p>
                          <p className="mt-1 text-slate-400">{row.code}</p>
                          <p className="mt-3 text-lg font-semibold text-emerald-400">
                            {row.qty_on_hand}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No location balances found.</p>
                    )}
                  </div>
                </Panel>

                <Panel title="Recent Movement History">
                  <div className="space-y-3">
                    {data.movementHistory.length ? (
                      data.movementHistory.map((movement) => (
                        <div
                          key={movement.id}
                          className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-200"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-white">{movement.movement_type}</span>
                            <span className="text-emerald-400">{movement.qty_delta}</span>
                          </div>
                          <p className="mt-2 text-slate-400">
                            {movement.location_name || movement.location_code || '-'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{movement.occurred_at}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No movement history found.</p>
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          </>
        ) : null}

        {showDeleteModal ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white">Are you sure?</h3>
              <p className="mt-3 text-sm text-slate-400">
                This will archive the consumable and remove it from the active product list.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isDeleting}
                  className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isDeleting ? 'Archiving...' : 'Yes, archive it'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default ConsumableDetailPage;
