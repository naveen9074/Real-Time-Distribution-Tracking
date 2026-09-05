import { useState, useMemo } from 'react';
import { Icons } from '../lib/icons.jsx';
import { updateVehiclePrice } from '../firebase.js';

export default function OverviewPage({
  vehicles = [],
  orders = [],
  newOrderId,
  loading,
  animKey,
  toast,
  setPage,
}) {
  const [timeRange, setTimeRange] = useState('today');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState('60');
  const [updatingPrice, setUpdatingPrice] = useState(false);

  // ── Filter Orders by Selected Time Range ──────────────────────────────────
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
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
      const t = o.timestamp instanceof Date ? o.timestamp : new Date(o.timestamp);
      if (isNaN(t.getTime())) return true;

      switch (timeRange) {
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
  }, [orders, timeRange]);

  // ── Aggregate Metrics ─────────────────────────────────────────────────────
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (Number(o.totalAmount || o.totalPrice) || 0), 0);
  }, [filteredOrders]);

  const totalBoxesSold = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0);
  }, [filteredOrders]);

  const totalFleetStock = useMemo(() => {
    return vehicles.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
  }, [vehicles]);

  const activePricePerUnit = vehicles[0]?.pricePerUnit || 60;

  // ── Weekly Chart Breakdown ────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const daysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      daysMap[key] = { key, revenue: 0, boxes: 0 };
    }

    orders.forEach((o) => {
      const t = o.timestamp instanceof Date ? o.timestamp : new Date(o.timestamp);
      if (!isNaN(t.getTime())) {
        const key = t.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        if (daysMap[key]) {
          daysMap[key].revenue += Number(o.totalAmount || o.totalPrice) || 0;
          daysMap[key].boxes += Number(o.quantity) || 0;
        }
      }
    });

    return Object.values(daysMap);
  }, [orders]);

  const maxChartRev = Math.max(...chartData.map((d) => d.revenue), 1);

  const rangeLabel = {
    today: "Today's",
    yesterday: "Yesterday's",
    '3days': 'Last 3 Days',
    '7days': 'Last 7 Days',
    month: 'This Month',
    all: 'All Time',
  }[timeRange];

  const handleUpdatePrice = async () => {
    const val = parseFloat(newPrice);
    if (isNaN(val) || val <= 0) {
      toast?.error?.('Please enter a valid price');
      return;
    }
    setUpdatingPrice(true);
    try {
      // update on all vehicles
      await Promise.all(vehicles.map((v) => updateVehiclePrice(v.id, val)));
      toast?.success?.(`Selling price updated to ₹${val}/box`);
      setShowPriceModal(false);
    } catch (err) {
      toast?.error?.(err.message || 'Failed to update price');
    } finally {
      setUpdatingPrice(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* ── Top Header & Range Switcher ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>DosaTrack</span>
            <span className="text-gray-500 font-normal">|</span>
            <span className="text-indigo-400 font-semibold text-lg">Sales &amp; Fleet Overview</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time multi-vehicle inventory &amp; revenue command console
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-surface-card border border-white/10 p-1.5 rounded-2xl">
          <span className="text-xs text-gray-400 font-semibold px-2">📅 Period:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-surface border border-white/10 text-indigo-300 text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-indigo-500/50 transition-colors"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="3days">Last 3 Days</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* ── Primary KPI Cards Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="kpi-card green">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
              {Icons.rupee}
            </div>
            <span className="badge badge-green text-[10px]">{rangeLabel}</span>
          </div>
          <div key={`rev-${animKey}`} className="text-3xl font-black text-white">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
            Total Revenue Collected
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Based on {filteredOrders.length} confirmed sales
          </div>
        </div>

        {/* Boxes Sold */}
        <div className="kpi-card blue">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400">
              {Icons.chart}
            </div>
            <span className="badge badge-blue text-[10px]">{rangeLabel}</span>
          </div>
          <div key={`boxes-${animKey}`} className="text-3xl font-black text-white">
            {totalBoxesSold} <span className="text-lg font-normal text-gray-400">boxes</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
            Total Boxes Sold
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Average: {filteredOrders.length > 0 ? (totalBoxesSold / filteredOrders.length).toFixed(1) : 0} boxes/order
          </div>
        </div>

        {/* Fleet Stock Remaining */}
        <div className="kpi-card amber">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400">
              {Icons.box}
            </div>
            <span className="badge badge-amber text-[10px]">{vehicles.length} Vehicles Active</span>
          </div>
          <div key={`stock-${animKey}`} className="text-3xl font-black text-white">
            {totalFleetStock} <span className="text-lg font-normal text-gray-400">boxes</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
            Total Van Stock in Field
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Auto-deducts on mobile sales
          </div>
        </div>

        {/* Price Per Unit (Interactive) */}
        <div className="kpi-card rose">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-400">
              🏷
            </div>
            <button
              onClick={() => {
                setNewPrice(String(activePricePerUnit));
                setShowPriceModal(true);
              }}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline"
            >
              Edit Price
            </button>
          </div>
          <div className="text-3xl font-black text-white">
            ₹{activePricePerUnit} <span className="text-base font-normal text-gray-400">/ box</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">
            Standard Selling Price
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            Applied to new delivery bills
          </div>
        </div>
      </div>

      {/* ── Fleet Assignment & Live Van Stock Section ─────────────────────── */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-3 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚚 Delivery Vehicles &amp; Assigned Stock</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Current stock assigned to each delivery driver. Updates automatically when driver sells via mobile.
            </p>
          </div>
          <button
            onClick={() => setPage('van')}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <span>Manage Fleet &amp; Stock</span> →
          </button>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => {
            const stockNum = Number(v.stock || 0);
            const stockColor = stockNum <= 5 ? '#ef4444' : stockNum <= 15 ? '#f59e0b' : '#10b981';
            const pct = Math.min((stockNum / 50) * 100, 100);

            return (
              <div
                key={v.id}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-indigo-500/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg">
                      🚐
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{v.name}</div>
                      <div className="text-xs text-gray-400">
                        Driver: <span className="text-gray-200 font-medium">{v.driverName || 'Assigned Rep'}</span>
                        {v.regNo && <span className="ml-2 text-gray-500">({v.regNo})</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black" style={{ color: stockColor }}>
                      {stockNum} <span className="text-xs font-normal text-gray-400">boxes</span>
                    </div>
                    <span className="text-[10px] text-gray-500">Available</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 stock-bar-track" style={{ height: 6 }}>
                  <div
                    className="stock-bar-fill"
                    style={{ width: `${pct}%`, backgroundColor: stockColor }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
                  <span>Phone: {v.driverPhone || '—'}</span>
                  <span>Rate: ₹{v.pricePerUnit || 60}/box</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Revenue Chart & Live Feed Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">Daily Revenue Trend</h2>
              <p className="text-xs text-gray-500 mt-0.5">Calculated by adding sold stocks together</p>
            </div>
            <span className="badge badge-blue">Last 7 Days</span>
          </div>

          <div className="flex items-end gap-2 h-36 pt-4">
            {chartData.map((d, idx) => {
              const pct = Math.round((d.revenue / maxChartRev) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    <div className="text-[10px] font-semibold bg-gray-900 text-white px-2.5 py-1 rounded-lg whitespace-nowrap border border-white/10 shadow-xl">
                      ₹{d.revenue.toLocaleString('en-IN')} ({d.boxes} boxes)
                    </div>
                  </div>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max(pct, 6)}%`,
                      background:
                        idx === chartData.length - 1
                          ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
                          : 'rgba(99, 102, 241, 0.25)',
                    }}
                  />
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{d.key.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Recent Orders Feed */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Live Orders Feed</h2>
              <p className="text-[10px] text-gray-500">Real-time sale stream</p>
            </div>
            <span className="badge badge-blue text-[10px]">{filteredOrders.length} sales</span>
          </div>

          <div className="overflow-y-auto flex-1 p-2" style={{ maxHeight: '340px' }}>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                <p className="text-2xl mb-2">📦</p>
                No sales in {rangeLabel.toLowerCase()}.
                <br />
                Perform a sale on the mobile app to see it live!
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOrders.slice(0, 8).map((o, idx) => {
                  const isNew = o.id === newOrderId || o._id === newOrderId;
                  return (
                    <div
                      key={o.id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isNew
                          ? 'bg-indigo-500/10 border-indigo-500/30 new-row'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {o.storeName || o.customerName}
                            {isNew && <span className="badge badge-green text-[9px] py-0">LIVE</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {o.vehicleName || 'Vehicle 1'} · {o.quantity} boxes
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-400">
                            ₹{(o.totalAmount || o.totalPrice || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {o.timestamp instanceof Date
                              ? o.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : 'Just now'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Price Update Modal ───────────────────────────────────────────── */}
      {showPriceModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowPriceModal(false)}>
          <div className="modal">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Update Product Price</h3>
                <p className="text-xs text-gray-400">Updates selling price per box across all vehicles</p>
              </div>
              <button onClick={() => setShowPriceModal(false)} className="text-gray-400 hover:text-white">
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Price Per Box (₹)
                </label>
                <div className="input flex items-center gap-2">
                  <span className="text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    className="bg-transparent flex-1 outline-none text-white font-bold"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowPriceModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleUpdatePrice}
                disabled={updatingPrice}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {updatingPrice ? 'Saving…' : 'Save New Price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
