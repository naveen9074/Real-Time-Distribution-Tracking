import { useState } from 'react';
import {
  assignStockToVehicle,
  setVehicleExactStock,
  updateVehiclePrice,
  addVehicle,
  updateVehicle,
} from '../firebase.js';
import { Icons } from '../lib/icons.jsx';

export default function VanPage({ vehicles = [], toast }) {
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
          const stockNum = Number(v.stock || 0);
          const stockColor = stockNum <= 5 ? '#ef4444' : stockNum <= 15 ? '#f59e0b' : '#10b981';
          const price = v.pricePerUnit || 60;
          const isSaving = savingId === v.id;

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

              {/* Big Stock Indicator */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Assigned Stock Remaining
                  </div>
                  <div className="text-4xl font-black mt-1" style={{ color: stockColor }}>
                    {stockNum} <span className="text-sm font-normal text-gray-400">boxes</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Current Rate
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">
                    ₹{price} <span className="text-xs font-normal text-gray-400">/ box</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    Total Value: ₹{(stockNum * price).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Action 1: Assign Stock (Add Boxes) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>📦 Assign Daily Stock to {v.name}</span>
                  </span>
                  <span className="text-[10px] text-gray-500">Adds boxes to current inventory</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Boxes to add (e.g. 10)"
                    value={assignInputs[v.id] || ''}
                    onChange={(e) =>
                      setAssignInputs((prev) => ({ ...prev, [v.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAssignStock(v)}
                    className="input flex-1 text-xs"
                  />
                  <button
                    onClick={() => handleAssignStock(v)}
                    disabled={isSaving}
                    className="btn-primary text-xs px-4 whitespace-nowrap"
                  >
                    {isSaving ? 'Assigning…' : 'Assign Stock'}
                  </button>
                </div>

                {/* Quick Addition Pill Buttons */}
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-[11px] text-gray-500 font-medium">Quick Assign:</span>
                  {[5, 10, 15, 20, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        setAssignInputs((prev) => ({ ...prev, [v.id]: String(num) }))
                      }
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action 2: Set Exact Stock Count */}
              <div className="border-t border-white/5 pt-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300">
                    Set Exact Stock (Manual Count / Reset)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Exact box count"
                    value={exactInputs[v.id] || ''}
                    onChange={(e) =>
                      setExactInputs((prev) => ({ ...prev, [v.id]: e.target.value }))
                    }
                    className="input flex-1 text-xs"
                  />
                  <button
                    onClick={() => handleSetExactStock(v)}
                    disabled={isSaving}
                    className="btn-secondary text-xs px-3 whitespace-nowrap"
                  >
                    Set Stock
                  </button>
                </div>
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
    </div>
  );
}
