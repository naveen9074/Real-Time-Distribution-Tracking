import { useEffect, useState } from 'react';
import {
  listenCustomers,
  addCustomer,
  updateCustomer,
  removeCustomer,
  assignCustomerToVehicle,
} from '../firebase.js';
import { Icons } from '../lib/icons.jsx';

export default function CustomersPage({ toast, vehicles = [] }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    address: '',
    phone: '',
    assignedVehicleId: '',
  });
  const [savingAdd, setSavingAdd] = useState(false);

  // Edit Modal
  const [editCustomerObj, setEditCustomerObj] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    phone: '',
    assignedVehicleId: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const unsub = listenCustomers((list) => {
      setCustomers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!addForm.name.trim()) {
      toast?.error?.('Store name is required');
      return;
    }
    setSavingAdd(true);
    try {
      await addCustomer({
        name: addForm.name.trim(),
        address: addForm.address.trim(),
        phone: addForm.phone.trim(),
        assignedVehicleId: addForm.assignedVehicleId || null,
      });
      toast?.success?.(`"${addForm.name}" added successfully!`);
      setAddForm({ name: '', address: '', phone: '', assignedVehicleId: '' });
      setShowAddModal(false);
    } catch (e) {
      toast?.error?.(e.message || 'Failed to add customer');
    } finally {
      setSavingAdd(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast?.error?.('Store name is required');
      return;
    }
    setSavingEdit(true);
    try {
      await updateCustomer(editCustomerObj.id, {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        phone: editForm.phone.trim(),
        assignedVehicleId: editForm.assignedVehicleId || null,
      });
      toast?.success?.(`Updated "${editForm.name}"!`);
      setEditCustomerObj(null);
    } catch (e) {
      toast?.error?.(e.message || 'Failed to update customer');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Remove "${c.name}" from stores list?`)) return;
    try {
      await removeCustomer(c.id);
      toast?.success?.(`"${c.name}" removed`);
    } catch {
      toast?.error?.('Delete failed');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Customer Stores &amp; Retailers</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage stores on delivery routes. Synced live to mobile salesperson apps.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          {Icons.plus} Add New Store
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <input
          className="input text-xs"
          placeholder="Search by store name, address, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Customer Stores Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-gray-500">
          <span className="text-4xl mb-3">🏪</span>
          <p className="text-sm font-medium text-gray-400">No stores found</p>
          <p className="text-xs text-gray-600 mt-1">Click "Add New Store" to register a delivery customer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="card-hover p-5 flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0">
                      {(c.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{c.name}</h3>
                      {c.phone && <div className="text-xs text-gray-400 mt-0.5">📞 {c.phone}</div>}
                    </div>
                  </div>
                </div>

                {c.address && (
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    📍 {c.address}
                  </p>
                )}

                {/* Route Assignment Selector */}
                <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400 font-medium">Assigned Route:</span>
                  <select
                    value={c.assignedVehicleId || ''}
                    onChange={async (e) => {
                      const val = e.target.value || null;
                      try {
                        await assignCustomerToVehicle(c.id, val);
                        const vName = val ? vehicles.find((v) => v.id === val)?.name || 'Vehicle' : 'None';
                        toast?.success?.(`"${c.name}" assigned to ${vName}`);
                      } catch {
                        toast?.error?.('Failed to update route');
                      }
                    }}
                    className="text-[11px] font-medium bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[160px] truncate"
                  >
                    <option value="" className="bg-[#0f1320] text-gray-400">Unassigned</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#0f1320] text-white">
                        🚐 {v.name} ({v.driverName || 'Driver'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons (Edit & Delete) */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    setEditCustomerObj(c);
                    setEditForm({
                      name: c.name || '',
                      address: c.address || '',
                      phone: c.phone || '',
                      assignedVehicleId: c.assignedVehicleId || '',
                    });
                  }}
                  className="text-[11px] font-semibold text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="btn-danger p-1 text-xs"
                  title="Remove store"
                >
                  {Icons.trash}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Store Modal ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Add Customer Store</h3>
                <p className="text-xs text-gray-400">Stores appear immediately in the delivery rep's app</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Store / Retailer Name *</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Mahalakshmi Mart"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Delivery Address</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. 5th Main, Malleshwaram"
                  value={addForm.address}
                  onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Contact Phone</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. 9876543210"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Assign to Delivery Route / Vehicle</label>
                <select
                  className="input text-xs"
                  value={addForm.assignedVehicleId || ''}
                  onChange={(e) => setAddForm((f) => ({ ...f, assignedVehicleId: e.target.value }))}
                >
                  <option value="">Unassigned (Select later)</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      🚐 {v.name} ({v.driverName || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={savingAdd}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {savingAdd ? 'Saving…' : 'Add Store'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Store Modal ─────────────────────────────────────────────── */}
      {editCustomerObj && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setEditCustomerObj(null)}
        >
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Edit Store Details</h3>
                <p className="text-xs text-gray-400">Update store name, address or contact details</p>
              </div>
              <button onClick={() => setEditCustomerObj(null)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Store / Retailer Name *</label>
                <input
                  className="input text-xs"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Delivery Address</label>
                <input
                  className="input text-xs"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Contact Phone</label>
                <input
                  className="input text-xs"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Assign to Delivery Route / Vehicle</label>
                <select
                  className="input text-xs"
                  value={editForm.assignedVehicleId || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, assignedVehicleId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      🚐 {v.name} ({v.driverName || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditCustomerObj(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
