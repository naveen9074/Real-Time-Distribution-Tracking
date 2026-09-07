import { useState, useMemo } from 'react';
import { addItem, updateItem, removeItem, assignItemToVehicle } from '../firebase.js';
import { Icons } from '../lib/icons.jsx';

export default function ItemsPage({ items = [], vehicles = [], toast }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    unit: 'Box',
    price: '60',
    category: 'Batter',
    description: '',
  });
  const [savingAdd, setSavingAdd] = useState(false);

  // Edit Item Modal
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    unit: 'Box',
    price: '60',
    category: 'Batter',
    description: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Assign Item to Vehicle Modal
  const [assigningItem, setAssigningItem] = useState(null);
  const [assignVehicleId, setAssignVehicleId] = useState(vehicles[0]?.id || 'van001');
  const [assignStock, setAssignStock] = useState('20');
  const [assignPrice, setAssignPrice] = useState('60');
  const [savingAssign, setSavingAssign] = useState(false);

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const s = new Set();
    items.forEach((it) => {
      if (it.category) s.add(it.category);
    });
    return Array.from(s);
  }, [items]);

  // ── Filtered items ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((it) => {
      const matchSearch =
        !q ||
        (it.name || '').toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q) ||
        (it.description || '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'all' || it.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  // Total fleet inventory across all vans
  const totalFleetUnits = useMemo(() => {
    let count = 0;
    vehicles.forEach((v) => {
      if (Array.isArray(v.items)) {
        v.items.forEach((it) => {
          count += Number(it.stock || 0);
        });
      } else {
        count += Number(v.stock || 0);
      }
    });
    return count;
  }, [vehicles]);

  const avgPrice = useMemo(() => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
    return Math.round(sum / items.length);
  }, [items]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddSubmit = async () => {
    if (!addForm.name.trim()) {
      toast?.error?.('Product name is required');
      return;
    }
    const priceNum = parseFloat(addForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast?.error?.('Please enter a valid price');
      return;
    }
    setSavingAdd(true);
    try {
      await addItem({
        name: addForm.name.trim(),
        unit: addForm.unit.trim() || 'Unit',
        price: priceNum,
        category: addForm.category.trim() || 'General',
        description: addForm.description.trim(),
      });
      toast?.success?.(`Added "${addForm.name}" to product catalog!`);
      setAddForm({ name: '', unit: 'Box', price: '60', category: 'Batter', description: '' });
      setShowAddModal(false);
    } catch (e) {
      toast?.error?.(e.message || 'Failed to add item');
    } finally {
      setSavingAdd(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.name.trim()) {
      toast?.error?.('Product name is required');
      return;
    }
    const priceNum = parseFloat(editForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast?.error?.('Please enter a valid price');
      return;
    }
    setSavingEdit(true);
    try {
      await updateItem(editItem.id, {
        name: editForm.name.trim(),
        unit: editForm.unit.trim() || 'Unit',
        price: priceNum,
        category: editForm.category.trim() || 'General',
        description: editForm.description.trim(),
      });
      toast?.success?.(`Updated "${editForm.name}"!`);
      setEditItem(null);
    } catch (e) {
      toast?.error?.(e.message || 'Failed to update item');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteItem = async (it) => {
    if (!window.confirm(`Delete "${it.name}" from catalog?`)) return;
    try {
      await removeItem(it.id);
      toast?.success?.(`"${it.name}" removed from catalog`);
    } catch {
      toast?.error?.('Failed to delete item');
    }
  };

  const handleOpenAssignModal = (it) => {
    setAssigningItem(it);
    setAssignVehicleId(vehicles[0]?.id || 'van001');
    setAssignStock('20');
    setAssignPrice(String(it.price || 60));
  };

  const handleAssignToVanSubmit = async () => {
    if (!assigningItem || !assignVehicleId) return;
    const qty = parseInt(assignStock, 10);
    const rate = parseFloat(assignPrice);
    if (isNaN(qty) || qty < 0) {
      toast?.error?.('Enter a valid stock quantity');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      toast?.error?.('Enter a valid selling rate');
      return;
    }
    setSavingAssign(true);
    try {
      await assignItemToVehicle(assignVehicleId, {
        itemId: assigningItem.id,
        name: assigningItem.name,
        unit: assigningItem.unit || 'Unit',
        stock: qty,
        price: rate,
      });
      const vName = vehicles.find((v) => v.id === assignVehicleId)?.name || 'Vehicle';
      toast?.success?.(`Loaded ${qty} ${assigningItem.unit}s of ${assigningItem.name} into ${vName}!`);
      setAssigningItem(null);
    } catch (e) {
      toast?.error?.(e.message || 'Failed to assign item to vehicle');
    } finally {
      setSavingAssign(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Products &amp; Items Catalog</h1>
          <p className="text-xs text-gray-400 mt-1">
            Define items to sell, set standard rates, and distribute stock to delivery reps
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          {Icons.plus} Add New Product
        </button>
      </div>

      {/* ── Summary KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg">
            📦
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Catalog Items</div>
            <div className="text-xl font-black text-white mt-0.5">{items.length} Products</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            🚐
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Fleet Inventory</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{totalFleetUnits} Units</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-lg">
            🏷
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Average Rate</div>
            <div className="text-xl font-black text-white mt-0.5">₹{avgPrice}</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
            🗂
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categories</div>
            <div className="text-xl font-black text-white mt-0.5">{categories.length || 1} Types</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <input
            className="input text-xs w-full pl-8"
            placeholder="Search products by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-2.5 top-2.5 text-gray-500 text-xs">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product Grid ─────────────────────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-gray-500">
          <span className="text-4xl mb-3">📦</span>
          <p className="text-sm font-medium text-gray-400">No products found</p>
          <p className="text-xs text-gray-600 mt-1">Click "Add New Product" to create items for delivery sale</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((it) => (
            <div key={it.id} className="card-hover p-5 flex flex-col justify-between group relative">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
                      📦
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{it.name}</h3>
                      {it.category && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          {it.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {it.description && (
                  <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                    {it.description}
                  </p>
                )}

                {/* Price & Unit Box */}
                <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-gray-500">Standard Price</span>
                    <div className="text-lg font-black text-white">
                      ₹{it.price} <span className="text-xs font-normal text-gray-400">/ {it.unit || 'Unit'}</span>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-300 font-semibold px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {it.unit || 'Box'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenAssignModal(it)}
                  className="btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1.5 flex-1 justify-center"
                  title="Load this item into a delivery vehicle"
                >
                  <span>🚐 Load Van</span>
                </button>

                <button
                  onClick={() => {
                    setEditItem(it);
                    setEditForm({
                      name: it.name || '',
                      unit: it.unit || 'Box',
                      price: String(it.price || 60),
                      category: it.category || 'Batter',
                      description: it.description || '',
                    });
                  }}
                  className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteItem(it)}
                  className="btn-danger p-1.5 text-xs"
                  title="Remove product"
                >
                  {Icons.trash}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Product Modal ────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Add Product to Catalog</h3>
                <p className="text-xs text-gray-400">Available to load onto delivery vehicles and sell</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Product Name *</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Idli Batter (1kg)"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Unit / Packaging *</label>
                  <select
                    className="input text-xs"
                    value={addForm.unit}
                    onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                  >
                    <option value="Box">Box</option>
                    <option value="Pouch">Pouch</option>
                    <option value="Pack">Pack</option>
                    <option value="Kg">Kg</option>
                    <option value="Carton">Carton</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Selling Rate (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-xs"
                    placeholder="e.g. 55"
                    value={addForm.price}
                    onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Category</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Batter, Spices, Ready-to-cook"
                  value={addForm.category}
                  onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Description (Optional)</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Fresh naturally fermented batter"
                  value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleAddSubmit}
                disabled={savingAdd}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {savingAdd ? 'Adding…' : 'Add to Catalog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ───────────────────────────────────────────── */}
      {editItem && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setEditItem(null)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Edit Product</h3>
                <p className="text-xs text-gray-400">Update product specifications &amp; default rate</p>
              </div>
              <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Product Name *</label>
                <input
                  className="input text-xs"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Unit / Packaging</label>
                  <select
                    className="input text-xs"
                    value={editForm.unit}
                    onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                  >
                    <option value="Box">Box</option>
                    <option value="Pouch">Pouch</option>
                    <option value="Pack">Pack</option>
                    <option value="Kg">Kg</option>
                    <option value="Carton">Carton</option>
                    <option value="Bottle">Bottle</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Selling Rate (₹)</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-xs"
                    value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Category</label>
                <input
                  className="input text-xs"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Description</label>
                <input
                  className="input text-xs"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditItem(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={savingEdit}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Assign Item to Van Modal ───────────────────────────────── */}
      {assigningItem && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setAssigningItem(null)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Load Item into Delivery Van</h3>
                <p className="text-xs text-gray-400">Allocate {assigningItem.name} stock to a delivery rep</p>
              </div>
              <button onClick={() => setAssigningItem(null)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Selected Product</label>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{assigningItem.name}</span>
                  <span className="text-indigo-300 font-semibold">{assigningItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Select Delivery Vehicle / Rep *</label>
                <select
                  className="input text-xs"
                  value={assignVehicleId}
                  onChange={(e) => setAssignVehicleId(e.target.value)}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      🚐 {v.name} ({v.driverName || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Stock to Load ({assigningItem.unit}s) *</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-xs"
                    value={assignStock}
                    onChange={(e) => setAssignStock(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Van Selling Rate (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-xs"
                    value={assignPrice}
                    onChange={(e) => setAssignPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setAssigningItem(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleAssignToVanSubmit}
                disabled={savingAssign}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {savingAssign ? 'Allocating…' : 'Load into Van'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
