import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Folder, ShoppingBag, Package, Home, LogOut, Percent, Layers, Truck, Users, Menu, X, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';

const AdminLayout = () => {
   const { user, logout } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

   const handleLogout = () => {
      logout();
      navigate('/');
   };

   // Route değişince sidebar'ı kapat (mobilde)
   useEffect(() => {
      setIsSidebarOpen(false);
   }, [location.pathname]);

   const menuItems = [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { path: '/admin/categories', label: 'Kategoriler', icon: Folder },
      { path: '/admin/products', label: 'Ürünler', icon: ShoppingBag },
      { path: '/admin/variations', label: 'Varyasyonlar', icon: Layers },
      { path: '/admin/options', label: 'Opsiyonlar', icon: Package }, // Used Package for options and moved Box for Orders? Wait, let's keep it simple.
      { path: '/admin/orders', label: 'Siparişler', icon: Package },
      { path: '/admin/discounts', label: 'İndirimler', icon: Percent },
      { path: '/admin/shipping', label: 'Kargo Ayarları', icon: Truck },
      { path: '/admin/customers', label: 'Müşteriler', icon: Users },
      { path: '/admin/reports', label: 'Raporlar', icon: BarChart3 },
   ];

   const getPageTitle = () => {
      const currentItem = menuItems.find(item => {
         if (item.exact) return location.pathname === item.path;
         return location.pathname.startsWith(item.path);
      });
      return currentItem ? currentItem.label : 'Admin Panel';
   };

   return (
      <div className="admin-layout">
         {/* Mobil Üst Bar (Sadece Mobilde Görünecek) */}
         <div className="admin-mobile-header">
            <button className="admin-mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
               <Menu size={24} />
            </button>
            <h2 className="admin-mobile-title">{getPageTitle()}</h2>
            <div style={{ width: 24, padding: '0.25rem' }}></div> {/* Dengeleyici */}
         </div>

         {/* Mobil Overlay */}
         <div 
            className={`admin-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
         />

         <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="admin-sidebar-header">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Admin Panel</h2>
                  <button className="admin-mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
                     <X size={24} />
                  </button>
               </div>
               <p className="admin-user">Merhaba, {user?.name}</p>
            </div>

            <nav className="admin-nav">
               {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                     <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                     >
                        <Icon size={18} /> {item.label}
                     </NavLink>
                  );
               })}
            </nav>

            <div className="admin-sidebar-footer">
               <NavLink to="/" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Home size={18} /> Ana Sayfa
               </NavLink>
               <button onClick={handleLogout} className="admin-nav-link" style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogOut size={18} /> Çıkış
               </button>
            </div>
         </aside>

         <main className="admin-main">
            <Outlet />
         </main>
      </div>
   );
};

export default AdminLayout;

