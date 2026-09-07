import { Icons } from '../lib/icons.jsx';

export default function Sidebar({ page, setPage, connected }) {
  const nav = [
    { id: 'overview',   label: 'Overview',   icon: Icons.home },
    { id: 'orders',     label: 'Orders',     icon: Icons.orders },
    { id: 'items',      label: 'Products & Items', icon: Icons.box },
    { id: 'customers',  label: 'Customers',  icon: Icons.customers },
    { id: 'van',        label: 'Vehicles & Stock', icon: Icons.van },
    { id: 'settings',   label: 'Settings',   icon: Icons.settings },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-lg font-black"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            D
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">DosaTrack</div>
            <div className="text-[10px] text-gray-500 tracking-wider uppercase">Operations</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5">
        {nav.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`nav-item w-full ${page === item.id ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Connection status */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: connected ? 'rgba(16,185,129,0.06)' : 'rgba(100,100,100,0.06)' }}>
          {connected
            ? <span className="live-dot" />
            : <span className="w-2 h-2 rounded-full bg-gray-600" />}
          <div>
            <div className="text-xs font-semibold" style={{ color: connected ? '#34d399' : '#6b7280' }}>
              {connected ? 'Live' : 'Disconnected'}
            </div>
            <div className="text-[10px] text-gray-600">
              {connected ? 'Realtime sync on' : 'Reconnecting…'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
