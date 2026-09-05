import axios from 'axios';

/**
 * BASE_URL — The address of the backend server.
 *
 * Physical device (Expo Go on same WiFi as your PC):
 *   Use your PC's LAN IP → find it with `ipconfig` in PowerShell
 *   Current: http://192.168.1.5:5000
 *
 * Android emulator (Android Studio AVD):
 *   Use http://10.0.2.2:5000  ← emulator's alias for host localhost
 *
 * iOS Simulator: use http://localhost:5000
 */
export const BASE_URL = 'http://192.168.1.5:5000'; // ← physical device on WiFi

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
