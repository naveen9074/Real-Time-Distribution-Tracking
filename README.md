# DosaTrack — Field Sales & Owner Tracking System

A complete real-time field sales tracking system built with **MERN + React Native**. Designed for dosa batter delivery businesses: the salesperson records sales on their phone, and the owner sees live updates on a web dashboard — no refresh needed.

---

## 📁 Project Structure

```
assesment/
├── backend/          # Node.js + Express + MongoDB + Socket.io
├── web/              # React (Vite) + Tailwind CSS  — Owner Dashboard
├── mobile/           # React Native (Expo)          — Salesperson App
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local install OR Docker)
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (or an emulator)

---

### Step 1 — Start MongoDB

**Option A: Docker (recommended)**
```bash
docker-compose up -d
```

**Option B: Local MongoDB**
Make sure MongoDB is running on `mongodb://localhost:27017`

---

### Step 2 — Backend

```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Seed the database (50 boxes + 10 customer stores)
npm run seed

# Start the development server
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### Step 3 — Web Dashboard (Owner)

```bash
cd web
npm install
npm run dev
```

Dashboard runs at: **http://localhost:3000**

---

### Step 4 — Mobile App (Salesperson)

> ⚠️ **Important**: Before starting, set the correct backend IP in `mobile/src/api/api.js`:
> - **Android Emulator**: `http://10.0.2.2:5000` (already set as default)
> - **Physical Device**: Use your computer's local IP (e.g. `http://192.168.1.5:5000`)
> - **iOS Simulator**: `http://localhost:5000`

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.

---

## 🔁 Data Flow

```
Mobile (SaleScreen)
  ── POST /api/orders ──▶  Backend
                               │
                          MongoDB: $inc stock (atomic)
                          MongoDB: insert Order
                               │
                          Socket.io: emit "sale_update"
                               │
                   ┌───────────┴───────────┐
             Web Dashboard             Mobile App
         (KPIs + table update)      (receipt screen)
```

---

## 🛠 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicle/stock` | Current van stock |
| GET | `/api/customers` | List of all customer stores |
| GET | `/api/orders` | Recent 50 orders |
| GET | `/api/orders/stats` | Today's revenue & boxes |
| POST | `/api/orders` | Create sale (atomic stock deduction) |
| GET | `/api/health` | Health check |

### POST `/api/orders` — Request Body
```json
{ "customerName": "Ravi Store", "quantity": 5 }
```

### Socket.io Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `sale_update` | Server → All clients | `{ order, stats, vehicleStock }` |

---

## 🎛 Configuration

| File | Variable | Default |
|------|----------|---------|
| `backend/.env` | `PORT` | `5000` |
| `backend/.env` | `MONGODB_URI` | `mongodb://localhost:27017/field_sales` |
| `mobile/src/api/api.js` | `BASE_URL` | `http://10.0.2.2:5000` |
| `web/.env` (optional) | `VITE_API_URL` | *(empty = Vite proxy)* |

---

## 📦 Default Seed Data

| Field | Value |
|-------|-------|
| Van Stock | **50 boxes** |
| Price per box | **₹60** |
| Customer stores | **10 stores** (Ravi Store, Lakshmi Provisions, etc.) |

Re-seed anytime: `cd backend && npm run seed`

---

## 🌟 Features

### Mobile App (Salesperson)
- Live van stock with animated counter
- Today's revenue, boxes sold, order count
- Customer dropdown from database
- Quantity stepper with live price preview
- Stock-after-sale preview before confirming
- Validation: cannot sell more than available stock
- Digital receipt with share button
- Real-time stock sync via Socket.io

### Web Dashboard (Owner)
- Total Revenue Today (live)
- Total Boxes Sold (live)
- Live Van Stock with colour-coded warnings
- Recent orders table with auto-scroll and slide-in animation
- Pulsing live connection indicator
- Premium dark theme with glassmorphism

---

## 🔧 Scripts

| Directory | Command | Description |
|-----------|---------|-------------|
| `backend/` | `npm run dev` | Start backend with hot reload |
| `backend/` | `npm run seed` | Reset and seed database |
| `web/` | `npm run dev` | Start web dashboard |
| `mobile/` | `npx expo start` | Start Expo dev server |
"# Real-Time-Distribution-Tracking" 
