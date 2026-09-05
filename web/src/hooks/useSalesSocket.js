import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * useSalesSocket
 *
 * Connects to the backend Socket.io server and listens for 'sale_update' events.
 * Returns:
 *  - connected  {boolean}   — current connection status
 *  - latestSale {object}    — the most recent sale_update payload
 *  - flashRow   {string}    — ID of the row that should flash (for animation)
 */
export function useSalesSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [latestSale, setLatestSale] = useState(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('sale_update', (data) => {
      setLatestSale(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected, latestSale };
}
