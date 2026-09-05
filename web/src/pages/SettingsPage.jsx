export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6" style={{ animation: 'slideUp 0.4s ease-out' }}>
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">System configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-bold text-white border-b border-white/5 pb-3">System Info</h2>
          {[
            { label: 'Backend', value: 'http://localhost:5000', sub: 'Express + MongoDB' },
            { label: 'Web Dashboard', value: 'http://localhost:3000', sub: 'React + Vite' },
            { label: 'Protocol', value: 'WebSocket / Socket.io', sub: 'Real-time push' },
            { label: 'Database', value: 'MongoDB Atlas', sub: 'Cloud hosted' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center">
              <div>
                <div className="text-xs font-semibold text-gray-300">{row.label}</div>
                <div className="text-[10px] text-gray-600">{row.sub}</div>
              </div>
              <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                {row.value}
              </code>
            </div>
          ))}
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-bold text-white border-b border-white/5 pb-3">Data Flow</h2>
          <div className="space-y-3">
            {[
              { step: '1', label: 'Salesperson makes sale', desc: 'Mobile app → POST /api/orders', color: '#6366f1' },
              { step: '2', label: 'Atomic stock deduction', desc: 'MongoDB updates van stock', color: '#8b5cf6' },
              { step: '3', label: 'Socket.io broadcast', desc: 'sale_update emitted to all clients', color: '#10b981' },
              { step: '4', label: 'Dashboard updates live', desc: 'KPIs animate, order appears', color: '#f59e0b' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: s.color }}>
                  {s.step}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-200">{s.label}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-sm font-bold text-white border-b border-white/5 pb-3 mb-4">API Endpoints</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Endpoint</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['GET',   '/api/vehicle/stock',          'Current van stock & price'],
                  ['PATCH', '/api/vehicle/stock',          'Update van stock or price (owner)'],
                  ['GET',   '/api/customers',              'List all customer stores'],
                  ['POST',  '/api/customers',              'Add a new customer store'],
                  ['DELETE','/api/customers/:id',          'Remove a customer store'],
                  ['GET',   '/api/orders',                 'Recent 50 orders'],
                  ['GET',   '/api/orders/stats',           'Today\'s revenue & box count'],
                  ['POST',  '/api/orders',                 'Record a sale (mobile app)'],
                  ['GET',   '/api/analytics/weekly',       'Last 7 days revenue breakdown'],
                  ['GET',   '/api/analytics/top-customers','Top 5 customers by revenue'],
                  ['GET',   '/api/health',                 'Backend health check'],
                ].map(([method, endpoint, desc]) => (
                  <tr key={endpoint}>
                    <td>
                      <span className={`badge text-[10px] ${
                        method === 'GET' ? 'badge-blue' :
                        method === 'POST' ? 'badge-green' :
                        method === 'PATCH' ? 'badge-amber' :
                        'badge-rose'
                      }`}>{method}</span>
                    </td>
                    <td><code className="text-xs text-gray-300 font-mono">{endpoint}</code></td>
                    <td className="text-xs text-gray-500">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
