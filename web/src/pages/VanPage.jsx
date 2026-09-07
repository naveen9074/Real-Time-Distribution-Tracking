import { useState, useMemo } from 'react';
import {
  assignStockToVehicle,
  setVehicleExactStock,
  updateVehiclePrice,
  addVehicle,
  updateVehicle,
  assignCustomerToVehicle,
  assignCustomersToVehicleBatch,
  assignItemToVehicle,
  adjustVehicleItemStock,
  setVehicleItemExactStock,
  updateVehicleItemPrice,
  removeVehicleItem,
} from '../firebase.js';
import { Icons } from '../lib/icons.jsx';

export default function VanPage({ vehicles = [], customers = [], items = [], toast }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [assignInputs, setAssignInputs] = useState({});
  const [exactInputs, setExactInputs] = useState({});
  const [priceInputs, setPriceInputs] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Add Vehicle Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    regNo: '',
    driverName: '',
    driverPhone: '',
    stock: '20',
    pricePerUnit: '60',
  });
  const [addingVehicle, setAddingVehicle] = useState(false);

  // Edit Vehicle Modal State
  const [editModalVehicle, setEditModalVehicle] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', regNo: '', driverName: '', driverPhone: '' });
  const [editingVehicle, setEditingVehicle] = useState(false);

  // Store Route Assignment Modal State
  const [routeModalVehicle, setRouteModalVehicle] = useState(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [routeSearch, setRouteSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState('all'); // 'all', 'selected', 'unassigned'
  const [savingRoute, setSavingRoute] = useState(false);

  // Load Item Modal State
  const [loadModalVehicle, setLoadModalVehicle] = useState(null);
  const [loadItemId, setLoadItemId] = useState('');
  const [loadStock, setLoadStock] = useState('20');
  const [loadPrice, setLoadPrice] = useState('60');
  const [loadingItemToVan, setLoadingItemToVan] = useState(false);
  const [itemExactInputs, setItemExactInputs] = useState({});

  // Vehicle lookup map
  const vehicleMap = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      map[v.id] = v;
    });
    return map;
  }, [vehicles]);

  const openRouteModal = (vehicle) => {
    setRouteModalVehicle(vehicle);
    const assignedIds = customers
      .filter((c) => c.assignedVehicleId === vehicle.id)
      .map((c) => c.id);
    setSelectedCustomerIds(new Set(assignedIds));
    setRouteSearch('');
    setRouteFilter('all');
  };

  const closeRouteModal = () => {
    setRouteModalVehicle(null);
    setSelectedCustomerIds(new Set());
    setRouteSearch('');
    setRouteFilter('all');
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const handleSelectAllVisible = (list) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      list.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleClearAllSelected = () => {
    setSelectedCustomerIds(new Set());
  };

  const handleSelectUnassignedOnly = () => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      customers
        .filter((c) => !c.assignedVehicleId || c.assignedVehicleId === routeModalVehicle?.id)
        .forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleSaveRoute = async () => {
    if (!routeModalVehicle) return;
    setSavingRoute(true);
    try {
      const currentAssigned = customers.filter(
        (c) => c.assignedVehicleId === routeModalVehicle.id
      );
      const currentAssignedIds = new Set(currentAssigned.map((c) => c.id));

      const toAssign = Array.from(selectedCustomerIds).filter(
        (id) => !currentAssignedIds.has(id)
      );
      const toUnassign = Array.from(currentAssignedIds).filter(
        (id) => !selectedCustomerIds.has(id)
      );

      await assignCustomersToVehicleBatch(toAssign, routeModalVehicle.id, toUnassign);

      toast?.success?.(
        `Route saved! ${selectedCustomerIds.size} stores assigned to ${routeModalVehicle.name}`
      );
      closeRouteModal();
    } catch (err) {
      toast?.error?.(err.message || 'Failed to update store assignments');
    } finally {
      setSavingRoute(false);
    }
  };

  const handleQuickUnassign = async (store, vehicle) => {
    try {
      await assignCustomerToVehicle(store.id, null);
      toast?.success?.(`Removed "${store.name}" from ${vehicle.name}`);
    } catch {
      toast?.error?.('Failed to unassign store');
    }
  };

  // ── Load Item to Van Handlers ──────────────────────────────────────────────
  const handleOpenLoadModal = (v) => {
    setLoadModalVehicle(v);
    const existingIds = new Set((v.items || []).map((it) => it.itemId));
    const available = items.filter((it) => !existingIds.has(it.id));
    const defaultPick = available[0] || items[0];
    if (defaultPick) {
      setLoadItemId(defaultPick.id);
      setLoadPrice(String(defaultPick.price || 60));
    } else {
      setLoadItemId('');
      setLoadPrice('60');
    }
    setLoadStock('20');
  };

  const handleLoadItemSubmit = async () => {
    if (!loadModalVehicle || !loadItemId) {
      toast?.error?.('Please select an item');
      return;
    }
    const product = items.find((it) => it.id === loadItemId);
    if (!product) return;
    const qty = parseInt(loadStock, 10);
    const rate = parseFloat(loadPrice);
    if (isNaN(qty) || qty < 0) {
      toast?.error?.('Please enter a valid stock quantity');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      toast?.error?.('Please enter a valid selling rate');
      return;
    }
    setLoadingItemToVan(true);
    try {
      await assignItemToVehicle(loadModalVehicle.id, {
        itemId: product.id,
        name: product.name,
        unit: product.unit || 'Unit',
        stock: qty,
        price: rate,
      });
      toast?.success?.(`Loaded ${qty} ${product.unit}s of ${product.name} into ${loadModalVehicle.name}!`);
      setLoadModalVehicle(null);
    } catch (e) {
      toast?.error?.(e.message || 'Failed to load item into vehicle');
    } finally {
      setLoadingItemToVan(false);
    }
  };

  const handleAdjustItemStock = async (vehicleId, item, delta) => {
    setSavingId(`${vehicleId}_${item.itemId}`);
    try {
      await adjustVehicleItemStock(vehicleId, item.itemId, delta);
      toast?.success?.(`Updated ${item.name} stock (${delta > 0 ? '+' : ''}${delta})`);
    } catch (e) {
      toast?.error?.('Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const handleSetItemExactStock = async (vehicleId, item) => {
    const inputKey = `${vehicleId}_${item.itemId}`;
    const qty = parseInt(itemExactInputs[inputKey], 10);
    if (isNaN(qty) || qty < 0) {
      toast?.error?.('Enter a valid stock number');
      return;
    }
    setSavingId(inputKey);
    try {
      await setVehicleItemExactStock(vehicleId, item.itemId, qty);
      toast?.success?.(`${item.name} stock set to ${qty} ${item.unit || 'units'}`);
      setItemExactInputs((prev) => ({ ...prev, [inputKey]: '' }));
    } catch (e) {
      toast?.error?.('Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const handleRemoveItemFromVan = async (vehicle, item) => {
    if (!window.confirm(`Remove ${item.name} from ${vehicle.name}?`)) return;
    try {
      await removeVehicleItem(vehicle.id, item.itemId);
      toast?.success?.(`Removed ${item.name} from ${vehicle.name}`);
    } catch {
      toast?.error?.('Failed to remove item');
    }
  };

  const modalFilteredCustomers = useMemo(() => {
    if (!routeModalVehicle) return [];
    const q = routeSearch.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q);

      if (!matchesSearch) return false;

      const isSelected = selectedCustomerIds.has(c.id);
      const isUnassigned = !c.assignedVehicleId;

      if (routeFilter === 'selected') return isSelected;
      if (routeFilter === 'unassigned') return isUnassigned;
      return true;
    });
  }, [customers, routeModalVehicle, routeSearch, routeFilter, selectedCustomerIds]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAssignStock = async (v) => {
    const qty = parseInt(assignInputs[v.id]);
    if (isNaN(qty) || qty === 0) {
      toast?.error?.('Please enter a valid quantity of boxes to assign');
      return;
    }
    setSavingId(v.id);
    try {
      const newTotal = await assignStockToVehicle(v.id, qty);
      toast?.success?.(`Assigned ${qty > 0 ? '+' : ''}${qty} boxes to ${v.name}! Total stock: ${newTotal} boxes`);
      setAssignInputs((prev) => ({ ...prev, [v.id]: '' }));
    } catch (e) {
      toast?.error?.(e.message || 'Failed to assign stock');
    } finally {
      setSavingId(null);
    }
  };

  const handleSetExactStock = async (v) => {
    const qty = parseInt(exactInputs[v.id]);
    if (isNaN(qty) || qty < 0) {
      toast?.error?.('Please enter a valid stock number');
      return;
    }
    if (!window.confirm(`Set ${v.name} stock to exactly ${qty} boxes?`)) return;
    setSavingId(v.id);
    try {
      await setVehicleExactStock(v.id, qty);
      toast?.success?.(`${v.name} stock set to ${qty} boxes`);
      setExactInputs((prev) => ({ ...prev, [v.id]: '' }));
    } catch (e) {
      toast?.error?.(e.message || 'Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdatePrice = async (v) => {
    const p = parseFloat(priceInputs[v.id]);
    if (isNaN(p) || p <= 0) {
      toast?.error?.('Please enter a valid price');
      return;
    }
    setSavingId(v.id);
    try {
      await updateVehiclePrice(v.id, p);
      toast?.success?.(`${v.name} price updated to ₹${p}/box`);
      setPriceInputs((prev) => ({ ...prev, [v.id]: '' }));
    } catch (e) {
      toast?.error?.(e.message || 'Failed to update price');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateVehicle = async () => {
    if (!addForm.name.trim() || !addForm.driverName.trim()) {
      toast?.error?.('Vehicle name and driver name are required');
      return;
    }
    setAddingVehicle(true);
    try {
      await addVehicle(addForm);
      toast?.success?.(`Added ${addForm.name} with Driver ${addForm.driverName}!`);
      setShowAddModal(false);
      setAddForm({ name: '', regNo: '', driverName: '', driverPhone: '', stock: '20', pricePerUnit: '60' });
    } catch (err) {
      toast?.error?.(err.message || 'Failed to add vehicle');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleSaveEditVehicle = async () => {
    if (!editForm.name.trim() || !editForm.driverName.trim()) {
      toast?.error?.('Vehicle name and driver name are required');
      return;
    }
    setEditingVehicle(true);
    try {
      await updateVehicle(editModalVehicle.id, editForm);
      toast?.success?.(`Updated ${editForm.name} details!`);
      setEditModalVehicle(null);
    } catch (err) {
      toast?.error?.(err.message || 'Failed to update vehicle');
    } finally {
      setEditingVehicle(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Vehicle Fleet &amp; Stock Assignment
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Assign daily stock to delivery reps, configure vehicles, and set box prices.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          {Icons.plus} Add New Vehicle
        </button>
      </div>

      {/* ── Vehicles Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles.map((v) => {
          const vanItems = Array.isArray(v.items) && v.items.length > 0
            ? v.items
            : [
                {
                  itemId: 'item_001',
                  name: 'Dosa Batter (1kg)',
                  unit: 'Box',
                  stock: Number(v.stock || 0),
                  price: Number(v.pricePerUnit || 60),
                },
              ];
          const totalStockUnits = vanItems.reduce((acc, it) => acc + Number(it.stock || 0), 0);
          const totalValuation = vanItems.reduce(
            (acc, it) => acc + Number(it.stock || 0) * Number(it.price || 0),
            0
          );
          const stockNum = totalStockUnits;
          const stockColor = stockNum <= 10 ? '#ef4444' : stockNum <= 30 ? '#f59e0b' : '#10b981';
          const isSaving = savingId === v.id;
          const assignedStores = customers.filter((c) => c.assignedVehicleId === v.id);

          return (
            <div key={v.id} className="card p-6 space-y-5 relative overflow-hidden">
              {/* Header: Vehicle & Driver */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-2xl border border-indigo-500/20">
                    🚐
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {v.name}
                      {v.regNo && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                          {v.regNo}
                        </span>
                      )}
                    </h2>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Delivery Rep: <span className="text-white font-semibold">{v.driverName || 'Unassigned'}</span>
                      {v.driverPhone && <span className="ml-2 text-indigo-300">📞 {v.driverPhone}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditModalVehicle(v);
                    setEditForm({
                      name: v.name || '',
                      regNo: v.regNo || '',
                      driverName: v.driverName || '',
                      driverPhone: v.driverPhone || '',
                    });
                  }}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Edit Details
                </button>
              </div>

              {/* Big Stock Indicator & Valuation */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Total Assigned Inventory
                  </div>
                  <div className="text-3xl font-black mt-1" style={{ color: stockColor }}>
                    {totalStockUnits} <span className="text-xs font-normal text-gray-400">total units</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {vanItems.length} product{vanItems.length > 1 ? 's' : ''} loaded on van
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Inventory Value
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    ₹{totalValuation.toLocaleString('en-IN')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenLoadModal(v)}
                    className="mt-1 text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1 ml-auto"
                  >
                    <span>➕ Load Product</span>
                  </button>
                </div>
              </div>

              {/* Multi-Item Inventory List */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>📦 Allocated Products &amp; Stock</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                      {vanItems.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenLoadModal(v)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    + Load Item to Van
                  </button>
                </div>

                <div className="space-y-2.5">
                  {vanItems.map((it) => {
                    const itStock = Number(it.stock || 0);
                    const itStockColor = itStock <= 5 ? '#ef4444' : itStock <= 15 ? '#f59e0b' : '#10b981';
                    const inputKey = `${v.id}_${it.itemId}`;
                    const isRowSaving = savingId === inputKey;

                    return (
                      <div key={it.itemId} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{it.name}</span>
                              <span className="text-[10px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                                {it.unit || 'Unit'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              Rate: <span className="text-white font-semibold">₹{it.price}</span> / {it.unit || 'unit'} • Value: <span className="text-emerald-400 font-semibold">₹{(itStock * (it.price || 0)).toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black" style={{ color: itStockColor }}>
                              {itStock} <span className="text-[10px] font-normal text-gray-400">{it.unit || 'units'}</span>
                            </span>
                            {vanItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemFromVan(v, it)}
                                className="text-gray-500 hover:text-rose-400 p-1 text-xs transition-colors"
                                title="Remove product from this van"
                              >
                                {Icons.trash}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quick Add Pills & Exact Stock */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-500 font-medium">Quick Add:</span>
                            {[5, 10, 20].map((delta) => (
                              <button
                                key={delta}
                                type="button"
                                disabled={isRowSaving}
                                onClick={() => handleAdjustItemStock(v.id, it, delta)}
                                className="px-2 py-0.5 rounded text-[11px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                              >
                                +{delta}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              placeholder="Exact"
                              value={itemExactInputs[inputKey] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItemExactInputs((prev) => ({ ...prev, [inputKey]: val }));
                              }}
                              className="input text-[11px] py-1 px-2 w-16 text-center"
                            />
                            <button
                              type="button"
                              disabled={isRowSaving}
                              onClick={() => handleSetItemExactStock(v.id, it)}
                              className="btn-secondary text-[10px] py-1 px-2.5 whitespace-nowrap"
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action 3: Assigned Customer Stores / Delivery Route */}
              <div className="border-t border-white/5 pt-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>🏪 Assigned Stores</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                        {assignedStores.length}
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openRouteModal(v)}
                    className="text-xs font-semibold text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center gap-1"
                  >
                    <span>⚙️ Manage Route</span>
                  </button>
                </div>

                {assignedStores.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-1.5">
                    <p className="text-xs text-gray-400">No stores assigned to {v.name} yet.</p>
                    <button
                      type="button"
                      onClick={() => openRouteModal(v)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                    >
                      + Assign customer stores (e.g. Arjun Stores, Saravana)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {assignedStores.map((store) => (
                        <span
                          key={store.id}
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200"
                          title={store.address ? `${store.name} — ${store.address}` : store.name}
                        >
                          <span className="text-[11px]">🏪</span>
                          <span className="font-medium truncate max-w-[130px]">{store.name}</span>
                          <button
                            type="button"
                            onClick={() => handleQuickUnassign(store, v)}
                            className="text-indigo-400/60 hover:text-rose-400 hover:bg-white/10 rounded px-1 transition-colors"
                            title={`Remove ${store.name} from ${v.name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-500">
                      <span>{assignedStores.length} store{assignedStores.length > 1 ? 's' : ''} on route</span>
                      <button
                        type="button"
                        onClick={() => openRouteModal(v)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Add / Edit Route →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add Vehicle Modal ────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Add Delivery Vehicle</h3>
                <p className="text-xs text-gray-400">Register a new van &amp; delivery rep</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Vehicle Label *</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Vehicle 3 (Van 003)"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Registration Number</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. KA-03-EF-9012"
                  value={addForm.regNo}
                  onChange={(e) => setAddForm((f) => ({ ...f, regNo: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Delivery Rep Name *</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Anand Sharma"
                  value={addForm.driverName}
                  onChange={(e) => setAddForm((f) => ({ ...f, driverName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Delivery Rep Phone</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. 9876543233"
                  value={addForm.driverPhone}
                  onChange={(e) => setAddForm((f) => ({ ...f, driverPhone: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Initial Stock (Boxes)</label>
                  <input
                    type="number"
                    className="input text-xs"
                    value={addForm.stock}
                    onChange={(e) => setAddForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Price / Box (₹)</label>
                  <input
                    type="number"
                    className="input text-xs"
                    value={addForm.pricePerUnit}
                    onChange={(e) => setAddForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCreateVehicle}
                disabled={addingVehicle}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {addingVehicle ? 'Creating…' : 'Register Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Vehicle Modal ────────────────────────────────────────────── */}
      {editModalVehicle && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setEditModalVehicle(null)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Edit {editModalVehicle.name}</h3>
                <p className="text-xs text-gray-400">Update vehicle details or assigned driver</p>
              </div>
              <button onClick={() => setEditModalVehicle(null)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Vehicle Label</label>
                <input
                  className="input text-xs"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Registration Number</label>
                <input
                  className="input text-xs"
                  value={editForm.regNo}
                  onChange={(e) => setEditForm((f) => ({ ...f, regNo: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Delivery Rep Name</label>
                <input
                  className="input text-xs"
                  value={editForm.driverName}
                  onChange={(e) => setEditForm((f) => ({ ...f, driverName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Delivery Rep Phone</label>
                <input
                  className="input text-xs"
                  value={editForm.driverPhone}
                  onChange={(e) => setEditForm((f) => ({ ...f, driverPhone: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditModalVehicle(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSaveEditVehicle}
                disabled={editingVehicle}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {editingVehicle ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Route Assignment Modal ────────────────────────────────────────── */}
      {routeModalVehicle && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && closeRouteModal()}
        >
          <div className="modal max-w-2xl w-full max-h-[90vh] flex flex-col p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl text-indigo-400">
                  🚐
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Assign Delivery Route: {routeModalVehicle.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Driver: <span className="text-white font-medium">{routeModalVehicle.driverName || 'Delivery Rep'}</span>
                    {routeModalVehicle.regNo && <span className="ml-2 text-gray-400">({routeModalVehicle.regNo})</span>}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRouteModal}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                {Icons.close}
              </button>
            </div>

            {/* Modal Controls: Search & Tabs */}
            <div className="py-3 space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stores by name, address, or phone..."
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  className="input text-xs w-full pl-9"
                  autoFocus
                />
                <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
                {routeSearch && (
                  <button
                    type="button"
                    onClick={() => setRouteSearch('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Filters and Bulk Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRouteFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      routeFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    All Stores ({customers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteFilter('selected')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      routeFilter === 'selected'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Selected for {routeModalVehicle.name} ({selectedCustomerIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteFilter('unassigned')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      routeFilter === 'unassigned'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Unassigned ({customers.filter((c) => !c.assignedVehicleId).length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllVisible(modalFilteredCustomers)}
                    className="text-[11px] text-indigo-300 hover:text-indigo-200 underline"
                  >
                    Select Visible
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllSelected}
                    className="text-[11px] text-gray-400 hover:text-gray-300 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Store List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 max-h-[360px] min-h-[180px]">
              {modalFilteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-2xl mb-1">🏪</p>
                  <p className="text-xs">No stores match your search or filter</p>
                </div>
              ) : (
                modalFilteredCustomers.map((c) => {
                  const isChecked = selectedCustomerIds.has(c.id);
                  const isAlreadyOnThis = c.assignedVehicleId === routeModalVehicle.id;
                  const isAssignedToOther = c.assignedVehicleId && c.assignedVehicleId !== routeModalVehicle.id;
                  const otherVehicle = isAssignedToOther ? vehicleMap[c.assignedVehicleId] : null;

                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCustomerSelection(c.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-sm shadow-indigo-500/10'
                          : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/[0.05] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by row onClick
                          className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {c.name}
                            </span>
                            {c.phone && (
                              <span className="text-[11px] text-gray-400">
                                📞 {c.phone}
                              </span>
                            )}
                          </div>
                          {c.address && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              📍 {c.address}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            ✓ On Route
                          </span>
                        ) : isAssignedToOther ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full" title={`Currently assigned to ${otherVehicle?.name || 'other vehicle'}`}>
                            🚐 {otherVehicle?.name || 'Other Van'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-400">
                <span className="font-bold text-white">{selectedCustomerIds.size}</span> stores selected for {routeModalVehicle.name}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeRouteModal}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoute}
                  disabled={savingRoute}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
                >
                  {savingRoute ? 'Saving Route…' : `Save Route (${selectedCustomerIds.size} stores)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Load Product into Van Modal ───────────────────────────────────── */}
      {loadModalVehicle && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setLoadModalVehicle(null)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Load Product into {loadModalVehicle.name}</h3>
                <p className="text-xs text-gray-400">Driver: {loadModalVehicle.driverName || 'Delivery Rep'}</p>
              </div>
              <button onClick={() => setLoadModalVehicle(null)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Select Catalog Product *</label>
                <select
                  className="input text-xs"
                  value={loadItemId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setLoadItemId(id);
                    const prod = items.find((it) => it.id === id);
                    if (prod) setLoadPrice(String(prod.price || 60));
                  }}
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      📦 {it.name} — Standard Rate: ₹{it.price}/{it.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Stock to Load *</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-xs"
                    value={loadStock}
                    onChange={(e) => setLoadStock(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Van Selling Rate (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-xs"
                    value={loadPrice}
                    onChange={(e) => setLoadPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setLoadModalVehicle(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleLoadItemSubmit}
                disabled={loadingItemToVan}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loadingItemToVan ? 'Loading…' : 'Load into Van'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
