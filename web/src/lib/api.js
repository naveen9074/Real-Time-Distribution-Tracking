import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const API = '';  // Vite proxy handles /api → localhost:5000

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [latestSale, setLatestSale] = useState(null);

  useEffect(() => {
    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('sale_update', (payload) => setLatestSale(payload));
    socket.on('stock_updated', (vehicle) => setLatestSale({ type: 'stock', vehicle }));
    return () => socket.disconnect();
  }, []);

  return { connected, latestSale };
}

export async function fetchJSON(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function postJSON(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function patchJSON(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function deleteJSON(path) {
  const r = await fetch(`${API}${path}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Delete failed');
  return r.json();
}
