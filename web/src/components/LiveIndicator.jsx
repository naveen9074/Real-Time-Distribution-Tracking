/**
 * LiveIndicator — pulsing dot showing Socket.io connection status.
 */
export default function LiveIndicator({ connected }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-border bg-surface-card text-sm">
      <span
        className={`relative flex h-2.5 w-2.5`}
      >
        {connected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            connected ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
      </span>
      <span className={connected ? 'text-emerald-400' : 'text-rose-400'}>
        {connected ? 'Live' : 'Connecting…'}
      </span>
    </div>
  );
}
