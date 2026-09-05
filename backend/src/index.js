require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const Vehicle = require('./models/Vehicle');
const Order = require('./models/Order');
const Customer = require('./models/Customer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Vehicle / Stock ───────────────────────────────────────────────────────────
// GET current van stock
app.get('/api/vehicle/stock', async (req, res) => {
  try {
    let vehicle = await Vehicle.findOne();
    if (!vehicle) vehicle = await Vehicle.create({});
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy alias used by web dashboard
app.get('/api/stock', async (req, res) => {
  try {
    let vehicle = await Vehicle.findOne();
    if (!vehicle) vehicle = await Vehicle.create({});
    res.json({ currentStock: vehicle.stock, pricePerUnit: vehicle.pricePerUnit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH — update van stock (restock from owner dashboard)
app.patch('/api/vehicle/stock', async (req, res) => {
  try {
    const { stock, pricePerUnit, name } = req.body;
    let vehicle = await Vehicle.findOne();
    if (!vehicle) vehicle = await Vehicle.create({});
    if (stock !== undefined) vehicle.stock = stock;
    if (pricePerUnit !== undefined) vehicle.pricePerUnit = pricePerUnit;
    if (name !== undefined) vehicle.name = name;
    await vehicle.save();
    // Broadcast restock event
    io.emit('stock_updated', vehicle);
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Customers ─────────────────────────────────────────────────────────────────
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Orders ────────────────────────────────────────────────────────────────────
// GET recent 50 orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ timestamp: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET today's stats
app.get('/api/orders/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orders = await Order.find({ timestamp: { $gte: today } });
    const totalBoxes = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    res.json({ totalBoxes, totalRevenue, orderCount: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy alias
app.get('/api/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orders = await Order.find({ timestamp: { $gte: today } });
    const totalBoxesSold = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    res.json({ totalBoxesSold, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET weekly analytics — last 7 days, grouped by day
app.get('/api/analytics/weekly', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orders = await Order.find({ timestamp: { $gte: sevenDaysAgo } });

    // Group by date string
    const grouped = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      grouped[key] = { revenue: 0, boxes: 0, orders: 0 };
    }

    orders.forEach((o) => {
      const key = new Date(o.timestamp).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
      });
      if (grouped[key]) {
        grouped[key].revenue += o.totalAmount;
        grouped[key].boxes += o.quantity;
        grouped[key].orders += 1;
      }
    });

    res.json(
      Object.entries(grouped).map(([day, data]) => ({ day, ...data }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET top customers by revenue
app.get('/api/analytics/top-customers', async (req, res) => {
  try {
    const top = await Order.aggregate([
      {
        $group: {
          _id: '$storeName',
          totalRevenue: { $sum: '$totalAmount' },
          totalBoxes: { $sum: '$quantity' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a sale — atomically deducts stock
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, storeName, quantity } = req.body;
    const name = customerName || storeName;

    if (!name || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'customerName and quantity are required.' });
    }

    const vehicle = await Vehicle.findOne();
    if (!vehicle) return res.status(500).json({ error: 'Vehicle not configured.' });
    if (vehicle.stock < quantity) {
      return res.status(400).json({ error: `Only ${vehicle.stock} boxes available.` });
    }

    const pricePerUnit = vehicle.pricePerUnit;
    const totalAmount = pricePerUnit * quantity;
    const totalPrice = totalAmount; // alias for mobile compatibility

    // Atomic deduct
    vehicle.stock -= quantity;
    await vehicle.save();

    const order = await Order.create({
      storeName: name,
      quantity,
      pricePerUnit,
      totalAmount,
      timestamp: new Date(),
    });

    // Recompute today's stats for the broadcast
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.find({ timestamp: { $gte: today } });
    const stats = {
      totalBoxes: todayOrders.reduce((s, o) => s + o.quantity, 0),
      totalRevenue: todayOrders.reduce((s, o) => s + o.totalAmount, 0),
      orderCount: todayOrders.length,
    };

    // Socket broadcast to all connected clients (web + mobile)
    io.emit('sale_update', {
      order: { ...order.toObject(), totalPrice },
      vehicleStock: vehicle.stock,
      stock: { currentStock: vehicle.stock },
      stats,
    });

    res.status(201).json({
      order: { ...order.toObject(), totalPrice, customerName: name },
      vehicleStock: vehicle.stock,
      pricePerUnit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// ── MongoDB + Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/field_sales';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('[db] MongoDB connected');

    // Auto-seed: create vehicle + customers if DB is empty
    const existingVehicle = await Vehicle.findOne();
    if (!existingVehicle) {
      await Vehicle.create({ name: 'Van 001', stock: 50, pricePerUnit: 60 });
      console.log('[seed] Vehicle created with 50 boxes @ ₹60/box');
    }
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      const stores = [
        { name: 'Ravi Store', address: 'MG Road, Bangalore', phone: '9876543210' },
        { name: 'Lakshmi Provisions', address: 'Jayanagar, Bangalore', phone: '9876543211' },
        { name: 'Sri Venkatesh Mart', address: 'Indiranagar, Bangalore', phone: '9876543212' },
        { name: 'Ganesh Kirana', address: 'Koramangala, Bangalore', phone: '9876543213' },
        { name: 'Murugan Stores', address: 'BTM Layout, Bangalore', phone: '9876543214' },
        { name: 'Saravana Departmental', address: 'HSR Layout, Bangalore', phone: '9876543215' },
        { name: 'Priya Super Mart', address: 'Banashankari, Bangalore', phone: '9876543216' },
        { name: 'Arjun Stores', address: 'Electronic City, Bangalore', phone: '9876543217' },
        { name: 'Kaveri Provisions', address: 'JP Nagar, Bangalore', phone: '9876543218' },
        { name: 'Nandi Supermarket', address: 'Yelahanka, Bangalore', phone: '9876543219' },
      ];
      await Customer.insertMany(stores);
      console.log('[seed] 10 customer stores created');
    }

    server.listen(PORT, () => {
      console.log(`[server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[db] Connection failed:', err.message);
    process.exit(1);
  });
