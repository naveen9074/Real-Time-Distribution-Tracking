Web Dashboard (Vite + React)

Quick start

1. Install dependencies

```bash
cd web
npm install
```

2. Start the dev server

```bash
npm run dev
```

Notes

- The web app expects the backend to be available at the same origin under `/api`.
- To point the web app to a standalone backend, set `VITE_API_URL` in a `.env` file, e.g.

```
VITE_API_URL=http://localhost:4000
```

- The dashboard connects to Socket.io and updates automatically when the mobile app posts a sale.
