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
  deleteDoc,
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

// ── Collection References ───────────────────────────────────────────────────
export const vehiclesColRef = collection(db, 'vehicles');
export const customersColRef = collection(db, 'customers');
export const ordersColRef = collection(db, 'orders');

// ── Seed functions ──────────────────────────────────────────────────────────
export async function ensureInitialData() {
  try {
    // 1. Ensure Vehicles
    const vSnap = await getDocs(vehiclesColRef);
    if (vSnap.empty) {
      await setDoc(doc(db, 'vehicles', 'van001'), {
        id: 'van001',
        name: 'Vehicle 1',
        regNo: 'KA-01-AB-1234',
        driverName: 'Ramesh Kumar',
        driverPhone: '9876543210',
        stock: 50,
        pricePerUnit: 60,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'vehicles', 'van002'), {
        id: 'van002',
        name: 'Vehicle 2',
        regNo: 'KA-05-CD-5678',
        driverName: 'Suresh Nair',
        driverPhone: '9876543222',
        stock: 30,
        pricePerUnit: 60,
        updatedAt: serverTimestamp(),
      });
      console.log('[Firebase] Initialized 2 Vehicles with drivers and assigned stock');
    }

    // 2. Ensure Customers
    const cSnap = await getDocs(customersColRef);
    if (cSnap.empty) {
      const defaultStores = [
        { name: 'Ravi Store', address: 'MG Road, Bangalore', phone: '9876543210' },
        { name: 'Lakshmi Provisions', address: 'Jayanagar 4th Block', phone: '9876543211' },
        { name: 'Sri Venkatesh Mart', address: '100ft Road, Indiranagar', phone: '9876543212' },
        { name: 'Ganesh Kirana', address: '5th Block, Koramangala', phone: '9876543213' },
        { name: 'Murugan Stores', address: '2nd Stage, BTM Layout', phone: '9876543214' },
        { name: 'Saravana Departmental', address: 'Sector 3, HSR Layout', phone: '9876543215' },
        { name: 'Priya Super Mart', address: 'Banashankari 2nd Stage', phone: '9876543216' },
        { name: 'Arjun Stores', address: 'Phase 1, Electronic City', phone: '9876543217' },
      ];
      for (const store of defaultStores) {
        await addDoc(customersColRef, store);
      }
      console.log('[Firebase] Initialized customer stores');
    }
  } catch (err) {
    console.error('[Firebase ensureInitialData error]', err);
  }
}

// ── Real-time Listeners ─────────────────────────────────────────────────────

/** Listen to all delivery vehicles in real-time */
export function listenVehicles(cb) {
  return onSnapshot(vehiclesColRef, (snap) => {
    if (snap.empty) {
      ensureInitialData().then(() => {
        cb([
          { id: 'van001', name: 'Vehicle 1', regNo: 'KA-01-AB-1234', driverName: 'Ramesh Kumar', driverPhone: '9876543210', stock: 50, pricePerUnit: 60 },
          { id: 'van002', name: 'Vehicle 2', regNo: 'KA-05-CD-5678', driverName: 'Suresh Nair', driverPhone: '9876543222', stock: 30, pricePerUnit: 60 },
        ]);
      });
    } else {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cb(list);
    }
  }, (err) => {
    console.error('[listenVehicles error]', err);
  });
}

/** Backwards-compatibility single van listener */
export function listenVan(cb) {
  return listenVehicles((vehicles) => {
    if (vehicles && vehicles.length > 0) {
      cb(vehicles[0]);
    }
  });
}

/** Listen to orders in real-time */
export function listenOrders(cb) {
  const q = query(ordersColRef, orderBy('timestamp', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => {
      const data = d.data();
      let ts = new Date();
      if (data.timestamp?.toDate) {
        ts = data.timestamp.toDate();
      } else if (data.timestamp) {
        ts = new Date(data.timestamp);
      }
      return {
        id: d.id,
        _id: d.id,
        ...data,
        timestamp: ts,
      };
    });
    cb(orders);
  }, (err) => {
    console.error('[listenOrders error]', err);
  });
}

/** Real-time Customers Listener */
export function listenCustomers(cb) {
  const q = query(customersColRef, orderBy('name'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
    cb(list);
  });
}

// ── Vehicle & Stock Management (Owner controls) ─────────────────────────────

/** Assign additional stock (e.g. +10 boxes) to a vehicle */
export async function assignStockToVehicle(vehicleId, addedBoxes) {
  const vRef = doc(db, 'vehicles', vehicleId);
  const snap = await getDocs(query(vehiclesColRef));
  const current = snap.docs.find(d => d.id === vehicleId)?.data()?.stock || 0;
  const newStock = Math.max(0, current + Number(addedBoxes));
  await updateDoc(vRef, {
    stock: newStock,
    updatedAt: serverTimestamp(),
  });
  return newStock;
}

/** Set exact stock count for a vehicle (e.g. after physical count) */
export async function setVehicleExactStock(vehicleId, exactStock) {
  const vRef = doc(db, 'vehicles', vehicleId);
  await updateDoc(vRef, {
    stock: Number(exactStock),
    updatedAt: serverTimestamp(),
  });
  return Number(exactStock);
}

/** Update per-box selling price */
export async function updateVehiclePrice(vehicleId, newPrice) {
  const vRef = doc(db, 'vehicles', vehicleId);
  await updateDoc(vRef, {
    pricePerUnit: Number(newPrice),
    updatedAt: serverTimestamp(),
  });
}

/** Add a new delivery vehicle */
export async function addVehicle(data) {
  const id = `van00${Date.now().toString().slice(-3)}`;
  await setDoc(doc(db, 'vehicles', id), {
    id,
    name: data.name || 'Vehicle',
    regNo: data.regNo || '',
    driverName: data.driverName || 'Delivery Rep',
    driverPhone: data.driverPhone || '',
    stock: Number(data.stock || 0),
    pricePerUnit: Number(data.pricePerUnit || 60),
    updatedAt: serverTimestamp(),
  });
}

/** Update vehicle or driver details */
export async function updateVehicle(vehicleId, data) {
  const vRef = doc(db, 'vehicles', vehicleId);
  await updateDoc(vRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ── Customer Management (Add, Edit, Delete) ─────────────────────────────────

export async function addCustomer(data) {
  const ref = await addDoc(customersColRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, _id: ref.id, ...data };
}

export async function updateCustomer(id, data) {
  const cRef = doc(db, 'customers', id);
  await updateDoc(cRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeCustomer(id) {
  await deleteDoc(doc(db, 'customers', id));
  return { success: true };
}

// ── Record Sale (Called from Mobile or Web) ─────────────────────────────────
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

  const orderRef = await addDoc(ordersColRef, {
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

  // Deduct stock on the specific vehicle
  const vRef = doc(db, 'vehicles', vehicleId);
  await updateDoc(vRef, {
    stock: stockAfter,
    updatedAt: serverTimestamp(),
  });

  return {
    id: orderRef.id,
    _id: orderRef.id,
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
    timestamp: new Date(),
  };
}
