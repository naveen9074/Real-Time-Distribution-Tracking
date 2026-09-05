import { useEffect, useState } from 'react';
import { useToast } from './lib/useToast.jsx';
import Sidebar from './components/Sidebar.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import VanPage from './pages/VanPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import {
  ensureInitialData,
  listenVehicles,
  listenOrders,
} from './firebase.js';

export default function App() {
  const [page, setPage] = useState('overview');
  const [connected, setConnected] = useState(false);
  const { Toast, toast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderId, setNewOrderId] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    // 1. Seed initial data (vehicles + sample stores)
    ensureInitialData().catch(console.error);

    // 2. Real-time Vehicles listener
    const unsubVehicles = listenVehicles((list) => {
      setVehicles(list);
      setConnected(true);
      setLoading(false);
    });

    // 3. Real-time Orders listener
    let isFirst = true;
    const unsubOrders = listenOrders((list) => {
      setOrders((prev) => {
        if (!isFirst && list.length > prev.length && list[0]) {
          const latest = list[0];
          const id = latest.id || latest._id;
          setNewOrderId(id);
          setAnimKey((k) => k + 1);
          toast.success(
            `🛒 Sale to ${latest.storeName || latest.customerName} — ₹${latest.totalAmount || latest.totalPrice} (${latest.quantity} boxes)`
          );
          setTimeout(() => setNewOrderId(null), 6000);
        }
        isFirst = false;
        return list;
      });
    });

    return () => {
      unsubVehicles();
      unsubOrders();
    };
  }, []);

  const renderPage = () => {
    const commonProps = {
      vehicles,
      orders,
      newOrderId,
      loading,
      animKey,
      toast,
      setPage,
    };

    switch (page) {
      case 'overview':
        return <OverviewPage {...commonProps} />;
      case 'orders':
        return <OrdersPage {...commonProps} />;
      case 'customers':
        return <CustomersPage toast={toast} />;
      case 'van':
        return <VanPage vehicles={vehicles} toast={toast} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage {...commonProps} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} setPage={setPage} connected={connected} />
      <main className="main-content flex-1">{renderPage()}</main>
      <Toast />
    </div>
  );
}
