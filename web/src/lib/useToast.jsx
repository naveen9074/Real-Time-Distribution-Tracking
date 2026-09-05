import { useState } from 'react';

/**
 * Toast — minimal toast notification system.
 * Usage: const { Toast, toast } = useToast();
 *        toast.success('Done!') / toast.error('Oops')
 */
export function useToast() {
  const [msg, setMsg] = useState(null);

  const show = (text, type = 'success') => {
    setMsg({ text, type, id: Date.now() });
    setTimeout(() => setMsg(null), 3500);
  };

  const toast = {
    success: (text) => show(text, 'success'),
    error:   (text) => show(text, 'error'),
  };

  function Toast() {
    if (!msg) return null;
    const cls = msg.type === 'success' ? 'toast-success' : 'toast-error';
    const icon = msg.type === 'success' ? '✓' : '✕';
    return (
      <div key={msg.id} className={cls}>
        <span className="text-base">{icon}</span>
        {msg.text}
      </div>
    );
  }

  return { Toast, toast };
}
