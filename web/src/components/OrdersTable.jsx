/**
 * OrdersTable — live-updating recent sales table.
 *
 * Props:
 *   orders     {Array}   — order documents, newest first
 *   newOrderId {string}  — _id of the most recently added order (triggers animation)
 *   loading    {boolean} — shows skeleton rows during initial data fetch
 */
export default function OrdersTable({ orders, newOrderId, loading = false }) {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount).toLocaleString('en-IN')}`;

  return (
    <div className="glass-card overflow-hidden">
      {/* Table header */}
      <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Recent Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live feed · newest first · last 50 sales
          </p>
        </div>
        <span className="text-xs text-slate-500 bg-surface-hover px-3 py-1 rounded-full border border-surface-border">
          {loading ? '—' : `${orders.length} orders`}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>

        {/* ── Skeleton loading state ── */}
        {loading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-2">
                <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-4 w-14 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-sm font-medium text-slate-500">No sales recorded yet today.</p>
            <p className="text-xs mt-1 text-slate-600">
              Make a sale on the mobile app — it'll appear here instantly.
            </p>
          </div>
        ) : (
          /* ── Orders table ── */
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border sticky top-0 bg-surface-card z-10">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stock After
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                // New row: animate slide-down so it's visually distinct from existing rows
                const isNew = order._id === newOrderId;
                return (
                  <tr
                    key={order._id || index}
                    className={`border-b border-surface-border/50 transition-colors duration-200 ${
                      isNew
                        ? 'bg-brand/10 animate-slide-down'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    {/* Customer — initial avatar + name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center text-brand-light text-xs font-bold flex-shrink-0">
                          {order.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-slate-200 block">
                            {order.customerName}
                          </span>
                          {Array.isArray(order.items) && order.items.length > 0 && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[200px] block" title={order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}>
                              {order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantity badge */}
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold text-xs">
                        {order.quantity} units
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                      {formatCurrency(order.totalAmount || order.totalPrice)}
                    </td>

                    {/* Stock after — color-coded to urgency */}
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          order.vehicleStockAfter <= 10
                            ? 'text-rose-400'
                            : order.vehicleStockAfter <= 20
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {order.vehicleStockAfter} units
                      </span>
                    </td>

                    {/* Time + NEW badge on fresh rows */}
                    <td className="px-6 py-4 text-right text-slate-500 text-xs">
                      {formatTime(order.createdAt)}
                      {isNew && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand/20 text-brand-light">
                          NEW
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
