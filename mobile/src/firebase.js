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

/** Listen to all vehicles in real-time */
export function listenVehicles(cb) {
  return onSnapshot(vehiclesColRef, (snap) => {
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cb(list);
    } else {
      cb([
        { id: 'van001', name: 'Vehicle 1', regNo: 'KA-01-AB-1234', driverName: 'Ramesh Kumar', stock: 50, pricePerUnit: 60 },
        { id: 'van002', name: 'Vehicle 2', regNo: 'KA-05-CD-5678', driverName: 'Suresh Nair', stock: 30, pricePerUnit: 60 },
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
  quantity,
  pricePerUnit = 60,
  stockBefore = 50,
}) {
  const totalAmount = quantity * pricePerUnit;
  const stockAfter = Math.max(0, stockBefore - quantity);

  const orderDoc = await addDoc(ordersColRef, {
    vehicleId,
    vehicleName,
    storeName,
    customerName: storeName,
    quantity,
    pricePerUnit,
    totalAmount,
    totalPrice: totalAmount,
    stockAfter,
    vehicleStockAfter: stockAfter,
    timestamp: serverTimestamp(),
  });

  const vRef = doc(db, 'vehicles', vehicleId);
  await updateDoc(vRef, {
    stock: stockAfter,
    updatedAt: serverTimestamp(),
  });

  return {
    id: orderDoc.id,
    _id: orderDoc.id,
    vehicleId,
    vehicleName,
    storeName,
    customerName: storeName,
    quantity,
    pricePerUnit,
    totalAmount,
    totalPrice: totalAmount,
    stockAfter,
    vehicleStockAfter: stockAfter,
    createdAt: new Date().toISOString(),
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
