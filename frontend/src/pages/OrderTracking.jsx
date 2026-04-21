import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import api from '../utils/api';

const OrderTracking = () => {
   const [searchType, setSearchType] = useState('email');
   const [searchValue, setSearchValue] = useState('');
   const [orderId, setOrderId] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [orders, setOrders] = useState([]);
   const [expandedOrder, setExpandedOrder] = useState(null);

   const handleSearch = async (e) => {
      e.preventDefault();
      setError('');
      setOrders([]);
      setExpandedOrder(null);

      if (searchType === 'email' && !searchValue.trim()) {
         setError('Lütfen e-posta adresinizi girin.');
         return;
      }
      if (searchType === 'phone' && !searchValue.trim()) {
         setError('Lütfen telefon numaranızı girin.');
         return;
      }
      if (searchType === 'orderId' && !orderId.trim()) {
         setError('Lütfen sipariş numaranızı girin.');
         return;
      }

      setLoading(true);
      try {
         let params = {};
         if (searchType === 'email') {
            params.email = searchValue.trim();
         } else if (searchType === 'phone') {
            params.phone = searchValue.trim();
         } else {
            params.orderId = orderId.trim();
         }

         const response = await api.get('/orders/track', { params });
         const data = response.data;

         if (data.success) {
            setOrders(data.data || []);
            if (data.data?.length === 0) {
               setError('Bu bilgilerle eşleşen sipariş bulunamadı.');
            }
         } else {
            setError(data.message || 'Siparişler yüklenemedi');
         }
      } catch (err) {
         console.error('Error tracking orders:', err);
         setError(err.response?.data?.message || 'Siparişler yüklenirken bir hata oluştu');
      } finally {
         setLoading(false);
      }
   };

   const getStatusInfo = (status) => {
      const statuses = {
         pending: { label: 'Ödeme Bekliyor', color: '#f59e0b', icon: Clock },
         paid: { label: 'Ödendi', color: '#10b981', icon: CheckCircle },
         confirmed: { label: 'Onaylandı', color: '#3b82f6', icon: CheckCircle },
         processing: { label: 'Hazırlanıyor', color: '#8b5cf6', icon: Package },
         shipped: { label: 'Kargoya Verildi', color: '#06b6d4', icon: Truck },
         delivered: { label: 'Teslim Edildi', color: '#10b981', icon: CheckCircle },
         cancelled: { label: 'İptal Edildi', color: '#ef4444', icon: XCircle }
      };
      return statuses[status] || { label: status, color: '#6b7280', icon: AlertCircle };
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

   return (
      <div className="container" style={{ padding: '2rem 0', maxWidth: '700px' }}>
         <h1 style={{ marginBottom: '0.5rem' }}>Sipariş Takibi</h1>
         <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Sipariş numaranız veya e-posta/telefon bilgilerinizle siparişlerinizi takip edin.
         </p>

         <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handleSearch}>
               <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <button
                     type="button"
                     onClick={() => setSearchType('email')}
                     style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: searchType === 'email' ? 'var(--color-primary)' : 'white',
                        color: searchType === 'email' ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontWeight: searchType === 'email' ? '600' : '400'
                     }}
                  >
                     E-posta
                  </button>
                  <button
                     type="button"
                     onClick={() => setSearchType('phone')}
                     style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: searchType === 'phone' ? 'var(--color-primary)' : 'white',
                        color: searchType === 'phone' ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontWeight: searchType === 'phone' ? '600' : '400'
                     }}
                  >
                     Telefon
                  </button>
                  <button
                     type="button"
                     onClick={() => setSearchType('orderId')}
                     style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        background: searchType === 'orderId' ? 'var(--color-primary)' : 'white',
                        color: searchType === 'orderId' ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontWeight: searchType === 'orderId' ? '600' : '400'
                     }}
                  >
                     Sipariş No
                  </button>
               </div>

               {searchType === 'orderId' ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                     <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="Sipariş numaranızı girin"
                        style={{
                           flex: 1,
                           padding: '0.75rem 1rem',
                           border: '1px solid var(--color-border)',
                           borderRadius: 'var(--radius)',
                           fontSize: '1rem'
                        }}
                     />
                  </div>
               ) : (
                  <input
                     type={searchType === 'email' ? 'email' : 'tel'}
                     value={searchValue}
                     onChange={(e) => setSearchValue(e.target.value)}
                     placeholder={searchType === 'email' ? 'E-posta adresinizi girin' : 'Telefon numaranızı girin'}
                     style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        fontSize: '1rem',
                        marginBottom: '0'
                     }}
                  />
               )}

               <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                     width: '100%',
                     marginTop: '1rem',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem'
                  }}
                  disabled={loading}
               >
                  {loading ? (
                     <span className="spinner" style={{ width: '20px', height: '20px' }}></span>
                  ) : (
                     <>
                        <Search size={18} />
                        Siparişleri Bul
                     </>
                  )}
               </button>
            </form>
         </div>

         {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <AlertCircle size={18} />
               {error}
            </div>
         )}

         {orders.length > 0 && (
            <div>
               <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                  {orders.length} sipariş bulundu
               </p>
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

                        {isExpanded && (
                           <div style={{ padding: '1.5rem' }}>
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
                                          {item.productName || item.product?.name || 'Ürün'}
                                       </p>
                                       <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                          {item.size && item.size !== 'Standart' ? `${item.size} • ` : ''}{item.quantity} adet
                                       </p>
                                    </div>
                                    <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                       {item.itemTotal?.toFixed(2) || item.basePrice?.toFixed(2)} ₺
                                    </p>
                                 </div>
                              ))}

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

<div style={{ marginTop: '1.5rem' }}>
                                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Teslimat Adresi</h4>
                                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                     {order.shippingAddress?.fullName}<br />
                                     {order.shippingAddress?.phone}<br />
                                     {order.shippingAddress?.address}<br />
                                     {order.shippingAddress?.neighborhood}, {order.shippingAddress?.district}/{order.shippingAddress?.city}
                                  </p>
                               </div>

{order.trackingNumber && (
                                   <div style={{ marginTop: '1.5rem' }}>
                                      <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                         <Truck size={18} /> Kargo Bilgileri
                                      </h4>
                                      <div style={{
                                         background: 'var(--color-bg-secondary)',
                                         padding: '1rem',
                                         borderRadius: 'var(--radius-md)',
                                         display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'space-between',
                                         gap: '1rem',
                                         flexWrap: 'wrap'
                                      }}>
                                         <div>
                                            {order.courier && (
                                               <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                                                  Kargo Firması: <strong>{order.courier}</strong>
                                               </p>
                                            )}
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Takip Numarası</p>
                                            <p style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                                               {order.trackingNumber}
                                            </p>
                                         </div>
                                         <button
                                            onClick={(e) => {
                                               e.stopPropagation();
                                               navigator.clipboard.writeText(order.trackingNumber);
                                            }}
                                            className="btn btn-secondary btn-sm"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                         >
                                            <Copy size={14} /> Kopyala
                                         </button>
                                     </div>
                                     <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                        Kargonuzu takip etmek için yukarıdaki numarayı kargo firmasının sitesinde sorgulayabilirsiniz.
                                     </p>
                                  </div>
                               )}
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

export default OrderTracking;