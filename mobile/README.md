Mobile (Expo)

Quick start

1. Install dependencies

```bash
cd mobile
npm install
```

2. Run the app (Android emulator) or use Expo Go on a device

```bash
npm start
```

Notes

- The mobile app expects the backend at `API_BASE` (`http://10.0.2.2:4000` by default for Android emulator). Update `API_BASE` in `App.js` when running on a physical device.
- The app connects to the backend via Socket.io to receive live `sale_update` events and updates the displayed stock automatically.
- No seed data is provided; if the DB is empty the app shows zero stock.
