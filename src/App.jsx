import { Routes, Route } from 'react-router-dom';
import OverviewPage from './pages/OverviewPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import SalesPage from './pages/SalesPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import BottomNav from './components/common/BottomNav.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function App() {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>
      <Sidebar />
      <div className="relative z-10 flex-1 pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

export default App;
