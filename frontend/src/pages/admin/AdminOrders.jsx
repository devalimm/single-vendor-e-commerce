import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { Package, Eye, ChevronDown, ChevronUp, Truck, CheckCircle, Clock, XCircle, RefreshCw, Search } from 'lucide-react';
const VITE_API_URL = import.meta.env.VITE_API_URL;

const statusConfig = {
   pending: { label: 'Beklemede', color: '#f59e0b', icon: Clock },
   confirmed: { label: 'Onaylandı', color: '#3b82f6', icon: CheckCircle },
   processing: { label: 'Hazırlanıyor', color: '#8b5cf6', icon: RefreshCw },
   shipped: { label: 'Kargoda', color: '#06b6d4', icon: Truck },
   delivered: { label: 'Teslim Edildi', color: '#10b981', icon: CheckCircle },
   cancelled: { label: 'İptal', color: '#ef4444', icon: XCircle }
};

const paymentStatusConfig = {
   pending: { label: 'Beklemede', color: '#f59e0b' },
   paid: { label: 'Ödendi', color: '#10b981' },
   failed: { label: 'Başarısız', color: '#ef4444' },
   refunded: { label: 'İade Edildi', color: '#8b5cf6' }
};

const AdminOrders = () => {
   const { showToast } = useToast();
   const [orders, setOrders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [expandedOrder, setExpandedOrder] = useState(null);
   const [filter, setFilter] = useState('all');
   const [searchQuery, setSearchQuery] = useState('');
   const [updatingOrder, setUpdatingOrder] = useState(null);

   // Filter orders based on search query
   const filteredOrders = useMemo(() => {
      if (!searchQuery.trim()) return orders;

      const query = searchQuery.toLowerCase().trim();
      return orders.filter(order => {
         const fullName = order.shippingAddress?.fullName?.toLowerCase() || '';
         const email = order.shippingAddress?.email?.toLowerCase() || '';
         const phone = order.shippingAddress?.phone?.toLowerCase() || '';
         const orderId = order._id.toLowerCase();

         return fullName.includes(query) ||
            email.includes(query) ||
            phone.includes(query) ||
            orderId.includes(query);
      });
   }, [orders, searchQuery]);

   const fetchOrders = async () => {
      try {
         const token = localStorage.getItem('token');

         const url = filter === 'all'
            ? `${VITE_API_URL}/orders/admin/all`
            : `${VITE_API_URL}/orders/admin/all?status=${filter}`;

         const response = await fetch(url, {
            headers: {
               'Authorization': `Bearer ${token}`
            }
         });

         console.log('Response status:', response.status);
         const data = await response.json();

         if (data.success) {
            setOrders(data.data);
         } else {
            console.error('API returned error:', data.message);
            showToast(data.message || 'Siparişler yüklenemedi', 'error');
         }
      } catch (error) {
         console.error('Fetch orders error:', error);
         showToast('Siparişler yüklenirken hata oluştu', 'error');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchOrders();
   }, [filter]);

   const updateStatus = async (orderId, newStatus) => {
      setUpdatingOrder(orderId);
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${VITEAPI_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
         });

         const data = await response.json();

         if (data.success) {
            showToast('Sipariş durumu güncellendi', 'success');
            fetchOrders();
         } else {
            showToast(data.message || 'Güncelleme başarısız', 'error');
         }
      } catch (error) {
         console.error('Update status error:', error);
         showToast('Güncelleme sırasında hata oluştu', 'error');
      } finally {
         setUpdatingOrder(null);
      }
   };

   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('tr-TR', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   };

   if (loading) {
      return (
         <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Siparişler yükleniyor...</p>
         </div>
      );
   }

   return (
      <div>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Package size={28} />
               Siparişler
            </h1>
            <button onClick={fetchOrders} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <RefreshCw size={18} />
               Yenile
            </button>
         </div>

         {/* Filters */}
         <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '350px' }}>
               <Search size={18} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)'
               }} />
               <input
                  type="text"
                  placeholder="Müşteri adı, e-posta, telefon veya sipariş no ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                     width: '100%',
                     padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                     border: '1px solid var(--color-border)',
                     borderRadius: 'var(--radius-md)',
                     fontSize: '0.875rem',
                     background: 'var(--color-bg-primary)',
                     color: 'var(--color-text-primary)'
                  }}
               />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
               <button
                  onClick={() => setFilter('all')}
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.875rem' }}
               >
                  Tümü
               </button>
               {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                     key={key}
                     onClick={() => setFilter(key)}
                     className={`btn ${filter === key ? 'btn-primary' : 'btn-secondary'}`}
                     style={{ fontSize: '0.875rem' }}
                  >
                     {config.label}
                  </button>
               ))}
            </div>
         </div>

         {filteredOrders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
               <Package size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
               <p style={{ color: 'var(--color-text-secondary)' }}>
                  {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz sipariş bulunmuyor'}
               </p>
            </div>
         ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {filteredOrders.map(order => {
                  const isExpanded = expandedOrder === order._id;
                  const StatusIcon = statusConfig[order.status]?.icon || Clock;

                  return (
                     <div key={order._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Order Header */}
                        <div
                           onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                           style={{
                              padding: '1.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: isExpanded ? 'var(--color-bg-secondary)' : 'transparent'
                           }}
                        >
                           <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                              <div>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Sipariş No</span>
                                 <p style={{ fontWeight: 'var(--font-weight-bold)', fontFamily: 'monospace' }}>
                                    #{order._id.slice(-8).toUpperCase()}
                                 </p>
                              </div>
                              <div>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Müşteri</span>
                                 <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                    {order.shippingAddress?.fullName || order.user?.name || 'Misafir'}
                                 </p>
                              </div>
                              <div>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Tarih</span>
                                 <p>{formatDate(order.createdAt)}</p>
                              </div>
                              <div>
                                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Toplam</span>
                                 <p style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                                    {order.total.toFixed(2)} ₺
                                 </p>
                              </div>
                              <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.5rem',
                                 padding: '0.5rem 0.75rem',
                                 borderRadius: 'var(--radius-full)',
                                 background: statusConfig[order.status]?.color + '20',
                                 color: statusConfig[order.status]?.color
                              }}>
                                 <StatusIcon size={16} />
                                 <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '0.875rem' }}>
                                    {statusConfig[order.status]?.label}
                                 </span>
                              </div>
                           </div>
                           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>

                        {/* Order Details (Expanded) */}
                        {isExpanded && (
                           <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                 {/* Customer Info */}
                                 <div>
                                    <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Müşteri Bilgileri</h4>
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                       <p><strong>{order.shippingAddress?.fullName}</strong></p>
                                       <p>{order.shippingAddress?.email}</p>
                                       <p>{order.shippingAddress?.phone}</p>
                                       {order.shippingAddress?.tcKimlik && (
                                          <p style={{ color: 'var(--color-text-secondary)' }}>TC: {order.shippingAddress.tcKimlik}</p>
                                       )}
                                    </div>
                                 </div>

                                 {/* Address */}
                                 <div>
                                    <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Teslimat Adresi</h4>
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                       <p>{order.shippingAddress?.neighborhood}, {order.shippingAddress?.district}</p>
                                       <p>{order.shippingAddress?.city}</p>
                                       <p>{order.shippingAddress?.address}</p>
                                    </div>
                                 </div>

                                 {/* Status Update */}
                                 <div>
                                    <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Durum Güncelle</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                       {Object.entries(statusConfig).map(([key, config]) => (
                                          <button
                                             key={key}
                                             onClick={() => updateStatus(order._id, key)}
                                             disabled={order.status === key || updatingOrder === order._id}
                                             className="btn btn-secondary"
                                             style={{
                                                fontSize: '0.75rem',
                                                padding: '0.5rem 0.75rem',
                                                opacity: order.status === key ? 0.5 : 1,
                                                borderColor: order.status === key ? config.color : undefined,
                                                color: order.status === key ? config.color : undefined
                                             }}
                                          >
                                             {config.label}
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              {/* Order Items */}
                              <div style={{ marginTop: '1.5rem' }}>
                                 <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Ürünler</h4>
                                 <div style={{
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden'
                                 }}>
                                    {order.items.map((item, idx) => (
                                       <div
                                          key={idx}
                                          style={{
                                             display: 'flex',
                                             alignItems: 'center',
                                             gap: '1rem',
                                             padding: '0.75rem 1rem',
                                             borderBottom: idx < order.items.length - 1 ? '1px solid var(--color-border)' : 'none'
                                          }}
                                       >
                                          {item.productImage && (
                                             <img
                                                src={`http://localhost:5000${item.productImage}`}
                                                alt={item.productName}
                                                style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                             />
                                          )}
                                          <div style={{ flex: 1 }}>
                                             <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>{item.productName}</p>
                                             <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                Beden: {item.size} {item.length && `• Boy: ${item.length}`}
                                             </p>
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                             <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>{item.itemTotal.toFixed(2)} ₺</p>
                                             <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>x{item.quantity}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Customer Note */}
                              {order.customerNote && (
                                 <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Müşteri Notu</h4>
                                    <p style={{
                                       background: 'var(--color-bg-secondary)',
                                       padding: '0.75rem 1rem',
                                       borderRadius: 'var(--radius-md)',
                                       fontStyle: 'italic'
                                    }}>
                                       "{order.customerNote}"
                                    </p>
                                 </div>
                              )}

                              {/* Order Summary */}
                              <div style={{
                                 marginTop: '1.5rem',
                                 paddingTop: '1rem',
                                 borderTop: '1px solid var(--color-border)',
                                 display: 'flex',
                                 justifyContent: 'flex-end',
                                 gap: '2rem'
                              }}>
                                 <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Ara Toplam</p>
                                    <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>{order.subtotal.toFixed(2)} ₺</p>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Kargo</p>
                                    <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                       {order.shippingCost === 0 ? 'Ücretsiz' : `${order.shippingCost.toFixed(2)} ₺`}
                                    </p>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Toplam</p>
                                    <p style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                                       {order.total.toFixed(2)} ₺
                                    </p>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
};

export default AdminOrders;
