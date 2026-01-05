import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Orders = () => {
   const [orders, setOrders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [expandedOrder, setExpandedOrder] = useState(null);

   useEffect(() => {
      fetchOrders();
   }, []);

   const fetchOrders = async () => {
      try {
         setLoading(true);
         const response = await fetch(`${API_URL}/orders/all`);
         const data = await response.json();

         if (data.success) {
            setOrders(data.data);
         } else {
            setError(data.message || 'Siparişler yüklenemedi');
         }
      } catch (err) {
         console.error('Error fetching orders:', err);
         setError('Siparişler yüklenirken bir hata oluştu');
      } finally {
         setLoading(false);
      }
   };

   const getStatusInfo = (status) => {
      const statuses = {
         pending: { label: 'Beklemede', color: '#f59e0b', icon: Clock },
         confirmed: { label: 'Onaylandı', color: '#3b82f6', icon: CheckCircle },
         processing: { label: 'Hazırlanıyor', color: '#8b5cf6', icon: Package },
         shipped: { label: 'Kargoya Verildi', color: '#06b6d4', icon: Truck },
         delivered: { label: 'Teslim Edildi', color: '#10b981', icon: CheckCircle },
         cancelled: { label: 'İptal Edildi', color: '#ef4444', icon: XCircle }
      };
      return statuses[status] || statuses.pending;
   };

   const formatDate = (date) => {
      return new Date(date).toLocaleDateString('tr-TR', {
         year: 'numeric',
         month: 'long',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   };

   if (loading) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   return (
      <div className="container" style={{ padding: '2rem 0', maxWidth: '900px' }}>
         <h1 style={{ marginBottom: '0.5rem' }}>Siparişler</h1>
         <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Toplam {orders.length} sipariş
         </p>

         {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
         )}

         {orders.length > 0 ? (
            <div>
               {orders.map(order => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  const isExpanded = expandedOrder === order._id;

                  return (
                     <div
                        key={order._id}
                        className="card"
                        style={{ marginBottom: '1rem', overflow: 'hidden' }}
                     >
                        {/* Order Header */}
                        <div
                           onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                           style={{
                              padding: '1rem 1.5rem',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'var(--color-bg-secondary)'
                           }}
                        >
                           <div>
                              <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.25rem' }}>
                                 {order.shippingAddress?.fullName || 'Müşteri'}
                              </p>
                              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                 #{order._id.slice(-8).toUpperCase()} • {formatDate(order.createdAt)}
                              </p>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                                 {order.total?.toFixed(2)} ₺
                              </span>
                              <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.5rem',
                                 padding: '0.4rem 0.75rem',
                                 background: `${statusInfo.color}20`,
                                 color: statusInfo.color,
                                 borderRadius: 'var(--radius-full)',
                                 fontWeight: 'var(--font-weight-medium)',
                                 fontSize: '0.8rem'
                              }}>
                                 <StatusIcon size={14} />
                                 {statusInfo.label}
                              </div>
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                           </div>
                        </div>

                        {/* Order Details (Expandable) */}
                        {isExpanded && (
                           <div style={{ padding: '1.5rem' }}>
                              {/* Products */}
                              <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Ürünler</h4>
                              {order.items?.map((item, idx) => (
                                 <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 0',
                                    borderBottom: idx < order.items.length - 1 ? '1px solid var(--color-border)' : 'none'
                                 }}>
                                    <div>
                                       <p style={{ fontWeight: 'var(--font-weight-medium)' }}>
                                          {item.product?.name || item.name || 'Ürün'}
                                       </p>
                                       <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                          {item.size && `Beden: ${item.size}`} {item.length && `• Boy: ${item.length}`} • {item.quantity} adet
                                       </p>
                                    </div>
                                    <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                       {item.price?.toFixed(2)} ₺
                                    </p>
                                 </div>
                              ))}

                              {/* Totals */}
                              <div style={{
                                 marginTop: '1rem',
                                 paddingTop: '1rem',
                                 borderTop: '1px solid var(--color-border)',
                                 fontSize: '0.9rem'
                              }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Ara Toplam:</span>
                                    <span>{order.subtotal?.toFixed(2)} ₺</span>
                                 </div>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Kargo:</span>
                                    <span>{order.shippingCost === 0 ? 'Ücretsiz' : `${order.shippingCost?.toFixed(2)} ₺`}</span>
                                 </div>
                                 <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontWeight: 'var(--font-weight-bold)',
                                    fontSize: '1rem',
                                    marginTop: '0.5rem'
                                 }}>
                                    <span>Toplam:</span>
                                    <span style={{ color: 'var(--color-primary)' }}>{order.total?.toFixed(2)} ₺</span>
                                 </div>
                              </div>

                              {/* Shipping Address */}
                              <div style={{ marginTop: '1.5rem' }}>
                                 <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Teslimat Adresi</h4>
                                 <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    {order.shippingAddress?.fullName}<br />
                                    {order.shippingAddress?.phone}<br />
                                    {order.shippingAddress?.address}<br />
                                    {order.shippingAddress?.neighborhood}, {order.shippingAddress?.district}/{order.shippingAddress?.city}
                                 </p>
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
               <Package size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
               <h3>Henüz sipariş yok</h3>
               <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                  İlk siparişinizi verin!
               </p>
               <Link to="/products" className="btn btn-primary">
                  Alışverişe Başla
               </Link>
            </div>
         )}
      </div>
   );
};

export default Orders;
