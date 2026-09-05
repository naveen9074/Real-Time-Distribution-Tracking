import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, addDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAhuGmlb5Hryx_WwspcORYLmK4O6g2OPuw",
  authDomain: "assesment-6fa65.firebaseapp.com",
  projectId: "assesment-6fa65",
  storageBucket: "assesment-6fa65.firebasestorage.app",
  messagingSenderId: "917729007769",
  appId: "1:917729007769:web:10e3602a40f3ca59878008",
  measurementId: "G-RY0RBB9YLR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testMobileSale() {
  const vanDocRef = doc(db, 'vehicle', 'van001');
  const snap = await getDoc(vanDocRef);
  const currentStock = snap.exists() ? snap.data().stock : 50;
  const price = snap.exists() ? snap.data().pricePerUnit : 60;
  
  const qtyToSell = 5;
  const storeName = 'Lakshmi Provisions';
  const totalAmount = qtyToSell * price;
  const stockAfter = currentStock - qtyToSell;

  console.log(`[TEST] Recording Sale: 5 boxes to ${storeName} @ Rs ${price}`);
  console.log(`[TEST] Current Stock: ${currentStock} -> New Stock: ${stockAfter}`);

  // 1. Add order
  const orderRef = await addDoc(collection(db, 'orders'), {
    storeName,
    customerName: storeName,
    quantity: qtyToSell,
    pricePerUnit: price,
    totalAmount,
    totalPrice: totalAmount,
    stockAfter,
    vehicleStockAfter: stockAfter,
    timestamp: serverTimestamp()
  });

  // 2. Auto deduct van stock
  await updateDoc(vanDocRef, {
    stock: stockAfter,
    updatedAt: serverTimestamp()
  });

  console.log(`[SUCCESS] Order Created with ID: ${orderRef.id}`);
  console.log(`[SUCCESS] Stock updated in Firestore to ${stockAfter}`);
  process.exit(0);
}

testMobileSale().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
