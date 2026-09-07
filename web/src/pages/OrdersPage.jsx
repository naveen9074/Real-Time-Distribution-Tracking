import { useState, useMemo } from 'react';
import { Icons } from '../lib/icons.jsx';

export default function OrdersPage({ orders = [], newOrderId, loading }) {
  const [filter, setFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // ── Extract unique vehicles from orders ───────────────────────────────────
  const vehicleOptions = useMemo(() => {
    const s = new Set();
    orders.forEach((o) => {
      if (o.vehicleName) s.add(o.vehicleName);
    });
    return Array.from(s);
  }, [orders]);

  // ── Filter orders ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOf3Days = new Date(startOfToday);
    startOf3Days.setDate(startOf3Days.getDate() - 2);
    const startOf7Days = new Date(startOfToday);
    startOf7Days.setDate(startOf7Days.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((o) => {
      const name = (o.storeName || o.customerName || '').toLowerCase();
      if (search && !name.includes(search.toLowerCase())) return false;

      if (vehicleFilter !== 'all' && (o.vehicleName || 'Vehicle 1') !== vehicleFilter) {
        return false;
      }

      const t = o.timestamp instanceof Date ? o.timestamp : new Date(o.timestamp);
      if (isNaN(t.getTime())) return true;

      switch (filter) {
        case 'today':
          return t >= startOfToday;
        case 'yesterday':
          return t >= startOfYesterday && t < startOfToday;
        case '3days':
          return t >= startOf3Days;
        case '7days':
          return t >= startOf7Days;
        case 'month':
          return t >= startOfMonth;
        case 'all':
        default:
          return true;
      }
    });
  }, [orders, search, vehicleFilter, filter]);

  // Totals for the currently filtered set
  const filteredTotalRev = useMemo(() => {
    return filtered.reduce((acc, o) => acc + (Number(o.totalAmount || o.totalPrice) || 0), 0);
  }, [filtered]);

  const filteredTotalBoxes = useMemo(() => {
    return filtered.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0);
  }, [filtered]);

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Recent Sales &amp; Orders</h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete transaction ledger synced live from field delivery reps
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            Total: ₹{filteredTotalRev.toLocaleString('en-IN')}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
            {filteredTotalBoxes} Boxes ({filtered.length} Orders)
          </div>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Customer Search */}
          <input
            className="input text-xs max-w-xs"
            placeholder="Search store name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Time Range Pills */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 bg-surface-card p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '3days', label: '3 Days' },
              { id: '7days', label: '7 Days' },
              { id: 'month', label: 'Month' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Selector Filter */}
        {vehicleOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Vehicle:</span>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="bg-surface-card border border-white/10 text-white text-xs font-semibold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="all">All Delivery Vehicles</option>
              {vehicleOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Orders Table ─────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton w-8 h-8 rounded-lg" />
                  <div className="skeleton h-4 flex-1 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-500">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm font-medium text-gray-400">No orders match the selected filters</p>
              <p className="text-xs text-gray-600 mt-1">Try selecting a different date range</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store / Customer</th>
                  <th>Delivery Rep / Vehicle</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-right">Van Stock After</th>
                  <th className="text-right">Time of Sale</th>
                  <th className="text-center">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, idx) => {
                  const isNew = o.id === newOrderId || o._id === newOrderId;
                  const name = o.storeName || o.customerName || 'Store';
                  const dateStr =
                    o.timestamp instanceof Date
                      ? o.timestamp.toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'Just now';

                  return (
                    <tr
                      key={o.id || idx}
                      className={isNew ? 'bg-indigo-500/10 new-row' : ''}
                    >
                      {/* Customer Store */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-gray-100 font-bold text-xs flex items-center gap-1.5">
                              {name}
                              {isNew && <span className="badge badge-green text-[9px] py-0">NEW</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      {/* Vehicle */}
                      <td>
                        <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                          <span>🚐</span> {o.vehicleName || 'Vehicle 1'}
                        </span>
                      </td>

                      {/* Items / Quantity */}
                      <td>
                        {Array.isArray(o.items) && o.items.length > 0 ? (
                          <div>
                            <span className="badge badge-blue text-xs font-semibold">
                              {o.quantity || o.items.reduce((a, b) => a + (b.quantity || 0), 0)} units
                            </span>
                            <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[170px]" title={o.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}>
                              {o.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="badge badge-blue text-xs">{o.quantity} units</span>
                            <div className="text-[10px] text-gray-400 mt-0.5">Dosa Batter (1kg)</div>
                          </div>
                        )}
                      </td>

                      {/* Rate / Breakdown */}
                      <td className="text-xs text-gray-400">
                        {Array.isArray(o.items) && o.items.length > 1 ? (
                          <span className="text-indigo-300 font-medium">{o.items.length} products</span>
                        ) : (
                          `₹${o.pricePerUnit || o.items?.[0]?.pricePerUnit || 60} / unit`
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="text-right">
                        <span className="text-emerald-400 font-bold text-sm">
                          ₹{(o.totalAmount || o.totalPrice || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Stock after */}
                      <td className="text-right text-xs text-gray-400">
                        {o.stockAfter !== undefined
                          ? `${o.stockAfter} units`
                          : o.vehicleStockAfter !== undefined
                          ? `${o.vehicleStockAfter} units`
                          : '—'}
                      </td>

                      {/* Time */}
                      <td className="text-right text-xs text-gray-500">{dateStr}</td>

                      {/* View Receipt */}
                      <td className="text-center">
                        <button
                          onClick={() => setSelectedReceipt(o)}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                        >
                          View Bill
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Receipt Modal ────────────────────────────────────────────────── */}
      {selectedReceipt && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setSelectedReceipt(null)}
        >
          <div className="modal max-w-md w-full">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">🧾 Digital Bill Receipt</h3>
                <p className="text-[10px] text-gray-500">Order #{selectedReceipt.id?.slice(0, 8)}</p>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Customer Store:</span>
                <span className="text-white font-bold">{selectedReceipt.storeName || selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery Vehicle:</span>
                <span className="text-white">{selectedReceipt.vehicleName || 'Vehicle 1'}</span>
              </div>

              {/* Itemized Breakdown Table */}
              <div className="border-t border-b border-white/5 py-2.5 my-2 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Item</span>
                  <span className="text-right">Qty × Rate = Total</span>
                </div>

                {Array.isArray(selectedReceipt.items) && selectedReceipt.items.length > 0 ? (
                  selectedReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-t border-white/[0.03]">
                      <div>
                        <span className="text-white font-medium">{it.name}</span>
                        <span className="text-[10px] text-gray-500 ml-1.5">({it.unit || 'unit'})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400">{it.quantity} × ₹{it.pricePerUnit}</span>
                        <span className="text-white font-bold ml-2">₹{it.subtotal || (it.quantity * it.pricePerUnit)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-white font-medium">Dosa Batter (1kg Box)</span>
                    <div className="text-right">
                      <span className="text-gray-400">{selectedReceipt.quantity} × ₹{selectedReceipt.pricePerUnit || 60}</span>
                      <span className="text-white font-bold ml-2">₹{selectedReceipt.totalAmount || selectedReceipt.totalPrice}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-1 flex justify-between text-sm">
                <span className="text-white font-bold">Total Bill:</span>
                <span className="text-emerald-400 font-black text-base">
                  ₹{(selectedReceipt.totalAmount || selectedReceipt.totalPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {selectedReceipt.stockAfter !== undefined && (
                <div className="pt-2 border-t border-white/5 flex justify-between text-[11px] text-gray-400">
                  <span>Van Stock Remaining:</span>
                  <span className="text-indigo-300 font-semibold">{selectedReceipt.stockAfter} units</span>
                </div>
              )}
            </div>

            <button onClick={() => setSelectedReceipt(null)} className="btn-secondary w-full mt-4 text-xs">
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
