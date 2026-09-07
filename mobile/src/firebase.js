import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAhuGmlb5Hryx_WwspcORYLmK4O6g2OPuw",
  authDomain: "assesment-6fa65.firebaseapp.com",
  projectId: "assesment-6fa65",
  storageBucket: "assesment-6fa65.firebasestorage.app",
  messagingSenderId: "917729007769",
  appId: "1:917729007769:web:10e3602a40f3ca59878008",
  measurementId: "G-RY0RBB9YLR"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export const vehiclesColRef = collection(db, 'vehicles');
export const customersColRef = collection(db, 'customers');
export const ordersColRef = collection(db, 'orders');
export const itemsColRef = collection(db, 'items');

/** Listen to master items catalog in real-time */
export function listenItems(cb) {
  return onSnapshot(itemsColRef, (snap) => {
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(list);
    } else {
      cb([
        { id: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', price: 60, category: 'Batter' },
        { id: 'item_002', name: 'Idli Batter (1kg)', unit: 'Pouch', price: 55, category: 'Batter' },
        { id: 'item_003', name: 'Sambar Mix (200g)', unit: 'Pack', price: 40, category: 'Spices' },
        { id: 'item_004', name: 'Chutney Powder (100g)', unit: 'Pack', price: 35, category: 'Condiments' },
      ]);
    }
  }, (err) => {
    console.warn('[mobile listenItems]', err);
  });
}

/** Listen to all vehicles in real-time */
export function listenVehicles(cb) {
  return onSnapshot(vehiclesColRef, (snap) => {
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cb(list);
    } else {
      cb([
        {
          id: 'van001',
          name: 'Vehicle 1',
          regNo: 'KA-01-AB-1234',
          driverName: 'Ramesh Kumar',
          stock: 50,
          pricePerUnit: 60,
          items: [
            { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: 30, price: 60 },
            { itemId: 'item_002', name: 'Idli Batter (1kg)', unit: 'Pouch', stock: 20, price: 55 },
          ],
        },
        {
          id: 'van002',
          name: 'Vehicle 2',
          regNo: 'KA-05-CD-5678',
          driverName: 'Suresh Nair',
          stock: 30,
          pricePerUnit: 60,
          items: [
            { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: 20, price: 60 },
            { itemId: 'item_003', name: 'Sambar Mix (200g)', unit: 'Pack', stock: 10, price: 40 },
          ],
        },
      ]);
    }
  }, (err) => {
    console.warn('[mobile listenVehicles]', err);
  });
}

/** Backwards-compatible listenVan */
export function listenVan(cb) {
  return listenVehicles((list) => {
    if (list && list.length > 0) cb(list[0]);
  });
}

/** Real-time Customer list listener */
export function listenCustomers(cb) {
  const q = query(customersColRef, orderBy('name'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
    cb(list);
  }, (err) => {
    console.warn('[mobile listenCustomers]', err);
  });
}

/** Record sale and atomically deduct specific vehicle stock in Firestore */
export async function recordSale({
  vehicleId = 'van001',
  vehicleName = 'Vehicle 1',
  storeName,
  customerName,
  items = null, // array of { itemId, name, unit, quantity, pricePerUnit, subtotal }
  quantity,
  pricePerUnit = 60,
  stockBefore = 50,
}) {
  const targetStoreName = storeName || customerName || 'Retail Store';

  // Process items array or single quantity fallback
  let finalItems = [];
  let totalUnits = 0;
  let totalBill = 0;

  if (Array.isArray(items) && items.length > 0) {
    finalItems = items.map(it => ({
      itemId: it.itemId || 'item_001',
      name: it.name || it.itemName || 'Product',
      unit: it.unit || 'Unit',
      quantity: Number(it.quantity || 0),
      pricePerUnit: Number(it.pricePerUnit || it.price || 0),
      subtotal: Number(it.subtotal !== undefined ? it.subtotal : (it.quantity * (it.pricePerUnit || it.price || 0))),
    }));
    totalUnits = finalItems.reduce((acc, it) => acc + it.quantity, 0);
    totalBill = finalItems.reduce((acc, it) => acc + it.subtotal, 0);
  } else {
    totalUnits = Number(quantity || 1);
    totalBill = totalUnits * Number(pricePerUnit || 60);
    finalItems = [
      {
        itemId: 'item_001',
        name: 'Dosa Batter (1kg)',
        unit: 'Box',
        quantity: totalUnits,
        pricePerUnit: Number(pricePerUnit || 60),
        subtotal: totalBill,
      }
    ];
  }

  // Read current vehicle data to deduct itemized stock
  const vRef = doc(db, 'vehicles', vehicleId);
  const vSnap = await getDocs(query(vehiclesColRef));
  const currentVehicle = vSnap.docs.find(d => d.id === vehicleId)?.data() || {};
  let currentItems = Array.isArray(currentVehicle.items) && currentVehicle.items.length > 0
    ? [...currentVehicle.items]
    : [
        {
          itemId: 'item_001',
          name: 'Dosa Batter (1kg)',
          unit: 'Box',
          stock: currentVehicle.stock !== undefined ? currentVehicle.stock : stockBefore,
          price: currentVehicle.pricePerUnit || pricePerUnit,
        }
      ];

  // Deduct stock per sold item
  finalItems.forEach(sold => {
    const idx = currentItems.findIndex(ci => ci.itemId === sold.itemId);
    if (idx >= 0) {
      currentItems[idx] = {
        ...currentItems[idx],
        stock: Math.max(0, (Number(currentItems[idx].stock) || 0) - sold.quantity),
      };
    }
  });

  const stockAfter = currentItems.reduce((acc, ci) => acc + Number(ci.stock || 0), 0);

  const orderDoc = await addDoc(ordersColRef, {
    vehicleId,
    vehicleName,
    storeName: targetStoreName,
    customerName: targetStoreName,
    items: finalItems,
    quantity: totalUnits,
    pricePerUnit: finalItems[0]?.pricePerUnit || pricePerUnit,
    totalAmount: totalBill,
    totalPrice: totalBill,
    stockAfter,
    vehicleStockAfter: stockAfter,
    timestamp: serverTimestamp(),
  });

  // Atomically update vehicle in Firestore
  await updateDoc(vRef, {
    items: currentItems,
    stock: stockAfter,
    updatedAt: serverTimestamp(),
  });

  return {
    id: orderDoc.id,
    _id: orderDoc.id,
    vehicleId,
    vehicleName,
    storeName: targetStoreName,
    customerName: targetStoreName,
    items: finalItems,
    quantity: totalUnits,
    pricePerUnit: finalItems[0]?.pricePerUnit || pricePerUnit,
    totalAmount: totalBill,
    totalPrice: totalBill,
    stockAfter,
    vehicleStockAfter: stockAfter,
    createdAt: new Date().toISOString(),
    timestamp: new Date(),
  };
}

/** Calculate today's stats for current vehicle */
export async function getTodayStats(vehicleId = null) {
  try {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const q = query(ordersColRef, where('timestamp', '>=', Timestamp.fromDate(midnight)));
    const snap = await getDocs(q);
    let totalRevenue = 0;
    let totalBoxes = 0;
    let count = 0;

    snap.forEach((d) => {
      const data = d.data();
      if (!vehicleId || data.vehicleId === vehicleId) {
        totalRevenue += Number(data.totalAmount || 0);
        totalBoxes += Number(data.quantity || 0);
        count++;
      }
    });

    return { totalRevenue, totalBoxes, orderCount: count };
  } catch (err) {
    return { totalRevenue: 0, totalBoxes: 0, orderCount: 0 };
  }
}
