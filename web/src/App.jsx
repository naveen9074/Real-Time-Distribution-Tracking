import { useEffect, useState } from 'react';
import { useToast } from './lib/useToast.jsx';
import Sidebar from './components/Sidebar.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import ItemsPage from './pages/ItemsPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import VanPage from './pages/VanPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import {
  ensureInitialData,
  listenVehicles,
  listenOrders,
  listenCustomers,
  listenItems,
} from './firebase.js';

export default function App() {
  const [page, setPage] = useState('overview');
  const [connected, setConnected] = useState(false);
  const { Toast, toast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderId, setNewOrderId] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    // 1. Seed initial data (vehicles + sample stores + product catalog)
    ensureInitialData().catch(console.error);

    // 2. Real-time Vehicles listener
    const unsubVehicles = listenVehicles((list) => {
      setVehicles(list);
      setConnected(true);
      setLoading(false);
    });

    // 3. Real-time Customers listener
    const unsubCustomers = listenCustomers((list) => {
      setCustomers(list);
    });

    // 4. Real-time Items listener
    const unsubItems = listenItems((list) => {
      setItems(list);
    });

    // 5. Real-time Orders listener
    let isFirst = true;
    const unsubOrders = listenOrders((list) => {
      setOrders((prev) => {
        if (!isFirst && list.length > prev.length && list[0]) {
          const latest = list[0];
          const id = latest.id || latest._id;
          setNewOrderId(id);
          setAnimKey((k) => k + 1);
          toast.success(
            `🛒 Sale to ${latest.storeName || latest.customerName} — ₹${latest.totalAmount || latest.totalPrice} (${latest.quantity} items)`
          );
          setTimeout(() => setNewOrderId(null), 6000);
        }
        isFirst = false;
        return list;
      });
    });

    return () => {
      unsubVehicles();
      unsubCustomers();
      unsubItems();
      unsubOrders();
    };
  }, []);

  const renderPage = () => {
    const commonProps = {
      vehicles,
      orders,
      customers,
      items,
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
      case 'items':
        return <ItemsPage items={items} vehicles={vehicles} toast={toast} />;
      case 'customers':
        return <CustomersPage toast={toast} vehicles={vehicles} customersList={customers} />;
      case 'van':
        return <VanPage vehicles={vehicles} customers={customers} items={items} toast={toast} />;
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
