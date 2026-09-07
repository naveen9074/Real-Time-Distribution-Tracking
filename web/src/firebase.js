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
export const itemsColRef = collection(db, 'items');

// ── Seed functions ──────────────────────────────────────────────────────────
export async function ensureInitialData() {
  try {
    // 1. Ensure Catalog Items
    const itSnap = await getDocs(itemsColRef);
    if (itSnap.empty) {
      const defaultCatalog = [
        {
          id: 'item_001',
          name: 'Dosa Batter (1kg)',
          unit: 'Box',
          price: 60,
          category: 'Batter',
          description: 'Fresh naturally fermented ready-to-cook batter',
        },
        {
          id: 'item_002',
          name: 'Idli Batter (1kg)',
          unit: 'Pouch',
          price: 55,
          category: 'Batter',
          description: 'Traditional steamed idli batter for soft idlis',
        },
        {
          id: 'item_003',
          name: 'Sambar Mix (200g)',
          unit: 'Pack',
          price: 40,
          category: 'Spices',
          description: 'Aromatic roasted South Indian sambar blend',
        },
        {
          id: 'item_004',
          name: 'Chutney Powder (100g)',
          unit: 'Pack',
          price: 35,
          category: 'Condiments',
          description: 'Spicy gun-powder chutney mix with roasted lentils',
        },
      ];
      for (const item of defaultCatalog) {
        await setDoc(doc(db, 'items', item.id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      console.log('[Firebase] Initialized default product items catalog');
    }

    // 2. Ensure Vehicles & Item Allocations
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
        items: [
          { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: 30, price: 60 },
          { itemId: 'item_002', name: 'Idli Batter (1kg)', unit: 'Pouch', stock: 20, price: 55 },
        ],
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
        items: [
          { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: 20, price: 60 },
          { itemId: 'item_003', name: 'Sambar Mix (200g)', unit: 'Pack', stock: 10, price: 40 },
        ],
        updatedAt: serverTimestamp(),
      });
      console.log('[Firebase] Initialized 2 Vehicles with drivers and assigned stock items');
    } else {
      // Ensure existing vehicles have items array populated
      for (const vDoc of vSnap.docs) {
        const vData = vDoc.data();
        if (!Array.isArray(vData.items) || vData.items.length === 0) {
          const defaultItems = [
            {
              itemId: 'item_001',
              name: 'Dosa Batter (1kg)',
              unit: 'Box',
              stock: vData.stock || 30,
              price: vData.pricePerUnit || 60,
            },
            {
              itemId: 'item_002',
              name: 'Idli Batter (1kg)',
              unit: 'Pouch',
              stock: 15,
              price: 55,
            },
          ];
          const totalStock = defaultItems.reduce((acc, it) => acc + it.stock, 0);
          await updateDoc(doc(db, 'vehicles', vDoc.id), {
            items: defaultItems,
            stock: totalStock,
          });
        }
      }
    }

    // 3. Ensure Customers
    const cSnap = await getDocs(customersColRef);
    if (cSnap.empty) {
      const defaultStores = [
        { name: 'Ravi Store', address: 'MG Road, Bangalore', phone: '9876543210', assignedVehicleId: 'van001' },
        { name: 'Lakshmi Provisions', address: 'Jayanagar 4th Block', phone: '9876543211', assignedVehicleId: 'van001' },
        { name: 'Sri Venkatesh Mart', address: '100ft Road, Indiranagar', phone: '9876543212', assignedVehicleId: 'van002' },
        { name: 'Ganesh Kirana', address: '5th Block, Koramangala', phone: '9876543213', assignedVehicleId: 'van002' },
        { name: 'Murugan Stores', address: '2nd Stage, BTM Layout', phone: '9876543214', assignedVehicleId: null },
        { name: 'Saravana Departmental', address: 'Sector 3, HSR Layout', phone: '9876543215', assignedVehicleId: 'van001' },
        { name: 'Priya Super Mart', address: 'Banashankari 2nd Stage', phone: '9876543216', assignedVehicleId: 'van002' },
        { name: 'Arjun Stores', address: 'Phase 1, Electronic City', phone: '9876543217', assignedVehicleId: 'van001' },
      ];
      for (const store of defaultStores) {
        await addDoc(customersColRef, store);
      }
      console.log('[Firebase] Initialized customer stores with assigned routes');
    }
  } catch (err) {
    console.error('[Firebase ensureInitialData error]', err);
  }
}

// ── Real-time Listeners ─────────────────────────────────────────────────────

/** Listen to products / items in real-time */
export function listenItems(cb) {
  const q = query(itemsColRef, orderBy('name'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      ensureInitialData().then(() => {
        cb([
          { id: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', price: 60, category: 'Batter' },
          { id: 'item_002', name: 'Idli Batter (1kg)', unit: 'Pouch', price: 55, category: 'Batter' },
          { id: 'item_003', name: 'Sambar Mix (200g)', unit: 'Pack', price: 40, category: 'Spices' },
          { id: 'item_004', name: 'Chutney Powder (100g)', unit: 'Pack', price: 35, category: 'Condiments' },
        ]);
      });
    } else {
      const list = snap.docs.map(d => ({ id: d.id, _id: d.id, ...d.data() }));
      cb(list);
    }
  }, (err) => {
    console.error('[listenItems error]', err);
  });
}

/** Listen to all delivery vehicles in real-time */
export function listenVehicles(cb) {
  return onSnapshot(vehiclesColRef, (snap) => {
    if (snap.empty) {
      ensureInitialData().then(() => {
        cb([
          {
            id: 'van001',
            name: 'Vehicle 1',
            regNo: 'KA-01-AB-1234',
            driverName: 'Ramesh Kumar',
            driverPhone: '9876543210',
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
            driverPhone: '9876543222',
            stock: 30,
            pricePerUnit: 60,
            items: [
              { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: 20, price: 60 },
              { itemId: 'item_003', name: 'Sambar Mix (200g)', unit: 'Pack', stock: 10, price: 40 },
            ],
          },
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

/** Assign a customer to a vehicle (or null to unassign) */
export async function assignCustomerToVehicle(customerId, vehicleId) {
  const cRef = doc(db, 'customers', customerId);
  await updateDoc(cRef, {
    assignedVehicleId: vehicleId || null,
    updatedAt: serverTimestamp(),
  });
}

/** Batch assign and unassign customers to a vehicle */
export async function assignCustomersToVehicleBatch(customerIdsToAssign = [], vehicleId, customerIdsToUnassign = []) {
  const promises = [];
  for (const cid of customerIdsToAssign) {
    const cRef = doc(db, 'customers', cid);
    promises.push(
      updateDoc(cRef, {
        assignedVehicleId: vehicleId,
        updatedAt: serverTimestamp(),
      })
    );
  }
  for (const cid of customerIdsToUnassign) {
    const cRef = doc(db, 'customers', cid);
    promises.push(
      updateDoc(cRef, {
        assignedVehicleId: null,
        updatedAt: serverTimestamp(),
      })
    );
  }
  await Promise.all(promises);
}

// ── Item / Product Catalog Management ───────────────────────────────────────

/** Add a new product to the catalog */
export async function addItem(data) {
  const id = `item_${Date.now().toString().slice(-4)}`;
  const ref = doc(db, 'items', id);
  const itemData = {
    id,
    name: data.name?.trim() || 'New Item',
    unit: data.unit?.trim() || 'Unit',
    price: Number(data.price || 0),
    category: data.category?.trim() || 'General',
    description: data.description?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, itemData);
  return itemData;
}

/** Update an existing product */
export async function updateItem(id, data) {
  const ref = doc(db, 'items', id);
  await updateDoc(ref, {
    ...data,
    price: data.price !== undefined ? Number(data.price) : undefined,
    updatedAt: serverTimestamp(),
  });
}

/** Remove an item from the catalog */
export async function removeItem(id) {
  await deleteDoc(doc(db, 'items', id));
  return { success: true };
}

// ── Vehicle Multi-Item Stock Allocation ─────────────────────────────────────

/** Assign an item to a vehicle with initial stock & vehicle price */
export async function assignItemToVehicle(vehicleId, itemData) {
  const vRef = doc(db, 'vehicles', vehicleId);
  const vSnap = await getDocs(query(vehiclesColRef));
  const currentVehicle = vSnap.docs.find(d => d.id === vehicleId)?.data() || {};
  const currentItems = Array.isArray(currentVehicle.items) ? [...currentVehicle.items] : [];

  const existingIndex = currentItems.findIndex(it => it.itemId === itemData.itemId);
  const newItem = {
    itemId: itemData.itemId,
    name: itemData.name,
    unit: itemData.unit || 'Unit',
    stock: Number(itemData.stock || 0),
    price: Number(itemData.price || 0),
  };

  if (existingIndex >= 0) {
    currentItems[existingIndex] = {
      ...currentItems[existingIndex],
      ...newItem,
      stock: currentItems[existingIndex].stock + Number(itemData.stock || 0),
    };
  } else {
    currentItems.push(newItem);
  }

  const totalStock = currentItems.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  await updateDoc(vRef, {
    items: currentItems,
    stock: totalStock,
    updatedAt: serverTimestamp(),
  });
  return currentItems;
}

/** Adjust stock for a specific item on a vehicle (+/- delta) */
export async function adjustVehicleItemStock(vehicleId, itemId, delta) {
  const vRef = doc(db, 'vehicles', vehicleId);
  const vSnap = await getDocs(query(vehiclesColRef));
  const currentVehicle = vSnap.docs.find(d => d.id === vehicleId)?.data() || {};
  let currentItems = Array.isArray(currentVehicle.items) && currentVehicle.items.length > 0
    ? [...currentVehicle.items]
    : [
        { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: currentVehicle.stock || 50, price: currentVehicle.pricePerUnit || 60 }
      ];

  currentItems = currentItems.map(it => {
    if (it.itemId === itemId) {
      return { ...it, stock: Math.max(0, (Number(it.stock) || 0) + Number(delta)) };
    }
    return it;
  });

  const totalStock = currentItems.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  await updateDoc(vRef, {
    items: currentItems,
    stock: totalStock,
    updatedAt: serverTimestamp(),
  });
  return currentItems;
}

/** Set exact stock count for an item on a vehicle */
export async function setVehicleItemExactStock(vehicleId, itemId, exactStock) {
  const vRef = doc(db, 'vehicles', vehicleId);
  const vSnap = await getDocs(query(vehiclesColRef));
  const currentVehicle = vSnap.docs.find(d => d.id === vehicleId)?.data() || {};
  let currentItems = Array.isArray(currentVehicle.items) && currentVehicle.items.length > 0
    ? [...currentVehicle.items]
    : [
        { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: currentVehicle.stock || 50, price: currentVehicle.pricePerUnit || 60 }
      ];

  currentItems = currentItems.map(it => {
    if (it.itemId === itemId) {
      return { ...it, stock: Math.max(0, Number(exactStock)) };
    }
    return it;
  });

  const totalStock = currentItems.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  await updateDoc(vRef, {
    items: currentItems,
    stock: totalStock,
    updatedAt: serverTimestamp(),
  });
  return currentItems;
}

/** Update selling rate for an item on a vehicle */
export async function updateVehicleItemPrice(vehicleId, itemId, newPrice) {
  const vRef = doc(db, 'vehicles', vehicleId);
  const vSnap = await getDocs(query(vehiclesColRef));
  const currentVehicle = vSnap.docs.find(d => d.id === vehicleId)?.data() || {};
  let currentItems = Array.isArray(currentVehicle.items) ? [...currentVehicle.items] : [];

  currentItems = currentItems.map(it => {
    if (it.itemId === itemId) {
      return { ...it, price: Number(newPrice) };
    }
    return it;
  });

  await updateDoc(vRef, {
    items: currentItems,
    updatedAt: serverTimestamp(),
  });
  return currentItems;
}

/** Remove an item allocation from a vehicle */
export async function removeVehicleItem(vehicleId, itemId) {
  const vRef = doc(db, 'vehicles', vehicleId);
  const vSnap = await getDocs(query(vehiclesColRef));
  const currentVehicle = vSnap.docs.find(d => d.id === vehicleId)?.data() || {};
  let currentItems = Array.isArray(currentVehicle.items) ? [...currentVehicle.items] : [];

  currentItems = currentItems.filter(it => it.itemId !== itemId);
  const totalStock = currentItems.reduce((acc, it) => acc + Number(it.stock || 0), 0);
  await updateDoc(vRef, {
    items: currentItems,
    stock: totalStock,
    updatedAt: serverTimestamp(),
  });
  return currentItems;
}

// ── Record Sale (Multi-Item or Single-Item) ──────────────────────────────────
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

  // Process items
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
    // Single quantity backwards compatibility
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

  // Read current vehicle data to deduct items stock
  const vRef = doc(db, 'vehicles', vehicleId);
  const vSnap = await getDocs(query(vehiclesColRef));
  const currentVehicle = vSnap.docs.find(d => d.id === vehicleId)?.data() || {};
  let currentItems = Array.isArray(currentVehicle.items) && currentVehicle.items.length > 0
    ? [...currentVehicle.items]
    : [
        { itemId: 'item_001', name: 'Dosa Batter (1kg)', unit: 'Box', stock: currentVehicle.stock || 50, price: currentVehicle.pricePerUnit || 60 }
      ];

  // Deduct stock per item
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

  const orderRef = await addDoc(ordersColRef, {
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

  // Atomically update vehicle with new item stocks & total stock
  await updateDoc(vRef, {
    items: currentItems,
    stock: stockAfter,
    updatedAt: serverTimestamp(),
  });

  return {
    id: orderRef.id,
    _id: orderRef.id,
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
