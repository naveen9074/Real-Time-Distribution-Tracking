Backend (Express + MongoDB + Socket.io)

Quick start

1. Install dependencies

```bash
cd backend
npm install
```

2. Start MongoDB locally (default URI: `mongodb://127.0.0.1:27017/delivery`).

3. Run the server

```bash
# dev with auto-reload
npm run dev
# or
npm start
```

Configuration

- `MONGO_URI` or `MONGODB_URI` environment variable to point to your MongoDB.
- `PORT` to change the server port (default 4000).

Notes

- There are no seed/demo scripts. If the DB is empty the API returns zeros/empty lists.
- The `/api/stores` endpoint returns a small hardcoded list for the demo.
- Stock is kept as a single document (`Stock`). This keeps the demo simple and makes
  the stock state deterministic and easy to explain during the interview.
