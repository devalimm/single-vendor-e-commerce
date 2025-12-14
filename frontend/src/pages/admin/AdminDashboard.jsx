import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { ShoppingBag, Folder, Package, Clock, Plus } from 'lucide-react';

const AdminDashboard = () => {
   const [stats, setStats] = useState({
      totalProducts: 0,
      totalCategories: 0,
      totalOrders: 0,
      pendingOrders: 0
   });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchStats = async () => {
         try {
            const [productsRes, categoriesRes, ordersRes] = await Promise.all([
               api.get('/products'),
               api.get('/categories'),
               api.get('/orders/admin/all')
            ]);

            const pendingOrders = ordersRes.data.data?.filter(
               order => order.status === 'pending'
            ).length || 0;

            setStats({
               totalProducts: productsRes.data.total || 0,
               totalCategories: categoriesRes.data.count || 0,
               totalOrders: ordersRes.data.total || 0,
               pendingOrders
            });
         } catch (error) {
            console.error('Error fetching stats:', error);
         } finally {
            setLoading(false);
         }
      };

      fetchStats();
   }, []);

   if (loading) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   return (
      <div className="admin-page">
         <div className="admin-header">
            <h1>Dashboard</h1>
            <p className="text-muted">Hoş geldiniz! İşte sitenizin özeti:</p>
         </div>

         <div className="stats-grid">
            <div className="stat-card">
               <div className="stat-icon"><ShoppingBag size={40} /></div>
               <div className="stat-info">
                  <h3>{stats.totalProducts}</h3>
                  <p>Toplam Ürün</p>
               </div>
            </div>

            <div className="stat-card">
               <div className="stat-icon"><Folder size={40} /></div>
               <div className="stat-info">
                  <h3>{stats.totalCategories}</h3>
                  <p>Kategori</p>
               </div>
            </div>

            <div className="stat-card">
               <div className="stat-icon"><Package size={40} /></div>
               <div className="stat-info">
                  <h3>{stats.totalOrders}</h3>
                  <p>Toplam Sipariş</p>
               </div>
            </div>

            <div className="stat-card stat-card-highlight">
               <div className="stat-icon"><Clock size={40} /></div>
               <div className="stat-info">
                  <h3>{stats.pendingOrders}</h3>
                  <p>Bekleyen Sipariş</p>
               </div>
            </div>
         </div>

         <div className="admin-quick-actions">
            <h2>Hızlı İşlemler</h2>
            <div className="quick-actions-grid">
               <a href="/admin/products/new" className="quick-action-card">
                  <span className="quick-action-icon"><Plus size={32} /></span>
                  <span>Yeni Ürün Ekle</span>
               </a>
               <a href="/admin/categories" className="quick-action-card">
                  <span className="quick-action-icon"><Folder size={32} /></span>
                  <span>Kategorileri Yönet</span>
               </a>
               <a href="/admin/orders" className="quick-action-card">
                  <span className="quick-action-icon"><Package size={32} /></span>
                  <span>Siparişleri Görüntüle</span>
               </a>
            </div>
         </div>
      </div>
   );
};

export default AdminDashboard;
