import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Folder, ShoppingBag, Package, Home, LogOut, Percent, Layers } from 'lucide-react';

const AdminLayout = () => {
   const { user, logout } = useAuth();
   const navigate = useNavigate();

   const handleLogout = () => {
      logout();
      navigate('/');
   };

   return (
      <div className="admin-layout">
         <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
               <h2>Admin Panel</h2>
               <p className="admin-user">Merhaba, {user?.name}</p>
            </div>

            <nav className="admin-nav">
               <Link to="/admin" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LayoutDashboard size={18} /> Dashboard
               </Link>
               <Link to="/admin/categories" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Folder size={18} /> Kategoriler
               </Link>
               <Link to="/admin/products" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag size={18} /> Ürünler
               </Link>
               <Link to="/admin/variations" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} /> Varyasyonlar
               </Link>
               <Link to="/admin/orders" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} /> Siparişler
               </Link>
               <Link to="/admin/discounts" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Percent size={18} /> İndirimler
               </Link>
            </nav>

            <div className="admin-sidebar-footer">
               <Link to="/" className="admin-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Home size={18} /> Ana Sayfa
               </Link>
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

