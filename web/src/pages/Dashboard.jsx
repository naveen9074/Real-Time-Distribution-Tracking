/**
 * Dashboard.jsx — Premium Owner Command Centre.
 *
 * Sync strategy: Socket.io WebSocket push for real-time updates.
 */
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}` : '';

// ── KPI Card Component with count-up animation ──────────────────────────────
function KPICard({ title, value, prefix = '', suffix = '', glowClass, animKey }) {
  return (
    <div className={`glass-card p-6 flex flex-col justify-between ${glowClass} relative overflow-hidden group`}>
      {/* Decorative gradient orb behind the card content */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-500" />
      
      <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-2">
        {title}
      </h3>
      <div 
        key={animKey} // Changing the key forces React to remount, re-triggering the CSS animation
        className="text-4xl font-black text-white animate-count-up flex items-baseline gap-1"
      >
        {prefix && <span className="text-2xl text-gray-400 font-bold">{prefix}</span>}
        {value}
        {suffix && <span className="text-xl text-gray-400 font-bold">{suffix}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stock, setStock] = useState(0);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalBoxesSold: 0 });
  const [animKey, setAnimKey] = useState(0); // Incremented on socket push to trigger CSS animations
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const s = await fetch(`${API_BASE}/api/stock`).then((r) => r.json());
        const o = await fetch(`${API_BASE}/api/orders`).then((r) => r.json());
        const sum = await fetch(`${API_BASE}/api/summary`).then((r) => r.json());
        setStock(s.currentStock ?? 0);
        setOrders(o);
        setSummary(sum);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      }
    }
    load();

    const socket = io(API_BASE || window.location.origin, { transports: ['websocket', 'polling'] });
    
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('sale_update', (payload) => {
      // Real-time optimistic update
      if (payload?.stock) setStock(payload.stock.currentStock);
      if (payload?.order) setOrders((prev) => [payload.order, ...prev].slice(0, 50));
      
      // Recompute summary client-side to ensure correctness
      fetch(`${API_BASE}/api/summary`).then((r) => r.json()).then(setSummary);
      
      // Trigger count-up animation on KPI cards
      setAnimKey(k => k + 1);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="min-h-screen p-8 md:p-12 lg:p-16 max-w-7xl mx-auto animate-fade-in">
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="text-brand-light">DosaTrack</span>
            <span className="text-2xl text-gray-500 font-medium">|</span>
            Owner Dashboard
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Real-time van stock and revenue monitoring.</p>
        </div>
        
        {/* Live connection badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${connected ? 'border-green-500/30 bg-green-500/10' : 'border-gray-500/30 bg-gray-500/10'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse-dot' : 'bg-gray-500'}`} />
          <span className={`text-sm font-bold tracking-wide uppercase ${connected ? 'text-green-400' : 'text-gray-400'}`}>
            {connected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </header>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <KPICard 
          title="Remaining Stock" 
          value={stock} 
          suffix="boxes"
          glowClass={stock <= 10 ? (stock === 0 ? 'kpi-glow-amber border-red-500/50' : 'kpi-glow-amber border-amber-500/50') : 'kpi-glow-green'} 
          animKey={`stock-${animKey}`}
        />
        <KPICard 
          title="Total Revenue Today" 
          value={summary.totalRevenue.toLocaleString('en-IN')} 
          prefix="₹"
          glowClass="kpi-glow-blue" 
          animKey={`rev-${animKey}`}
        />
        <KPICard 
          title="Boxes Sold Today" 
          value={summary.totalBoxesSold} 
          glowClass="kpi-glow-blue" 
          animKey={`sold-${animKey}`}
        />
      </div>

      {/* ── Recent Orders Table ─────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-surface-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <span className="text-xs font-semibold text-brand-light bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
            {orders.length} orders
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-surface-border">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Time</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Store</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right w-24">Qty</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No orders today yet.
                  </td>
                </tr>
              ) : (
                orders.map((o, i) => (
                  <tr 
                    key={o._id} 
                    // animate-slide-down triggers when a new row is unshifted into the array
                    className={`border-b border-surface-border/50 hover:bg-white/[0.02] transition-colors ${i === 0 ? 'animate-slide-down' : ''}`}
                  >
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-sm font-semibold text-white">
                      {o.storeName}
                    </td>
                    <td className="p-4 text-sm font-bold text-brand-light text-right">
                      {o.quantity}
                    </td>
                    <td className="p-4 text-sm font-bold text-green-400 text-right">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
