import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { calculateItemTotals, calculateCartTotals, calculateShippingCost } from '../utils/pricing';
import { useShippingSettings } from '../hooks/useShippingSettings';
import { getImageUrl } from '../utils/api';

const Cart = () => {
   const { cart, removeFromCart, updateQuantity } = useCart();
   const { settings: shippingSettings } = useShippingSettings();

   const { subtotal, totalVat, grandTotal, totalDiscount } = useMemo(() => {
      return calculateCartTotals(cart.items);
   }, [cart.items]);

   const shippingCost = useMemo(() => {
      return calculateShippingCost(shippingSettings, grandTotal, cart.totalItems);
   }, [shippingSettings, grandTotal, cart.totalItems]);

   if (cart.items.length === 0) {
      return (
         <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
            <ShoppingBag size={64} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h2>Sepetiniz Boş</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
               Alışverişe başlamak için ürünleri inceleyin
            </p>
            <Link to="/" className="btn btn-primary">
               Alışverişe Başla
            </Link>
         </div>
      );
   }

   return (
      <div className="container" style={{ padding: '2rem 0' }}>
         <h1 style={{ marginBottom: '2rem' }}>Sepetim</h1>

         <div className="cart-layout">
            <div>
               {cart.items.map((item, index) => {
                  const { basePrice, finalPrice, hasDiscount, itemTotal } = calculateItemTotals(item);

                  return (
                     <div key={index} className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                           <img
                              src={item.image ? getImageUrl(item.image) : 'https://via.placeholder.com/100'}
                              alt={item.name}
                              style={{ width: '100px', height: '133px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                           />

                           <div style={{ flex: 1 }}>
                              <h3 style={{ marginBottom: '0.5rem' }}>{item.name}</h3>

                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                 {item.variationSelections?.length > 0 && (
                                    <p>{item.variationSelections.map(s => `${s.variationName}: ${s.optionName}${s.extraPrice > 0 ? ` (+${s.extraPrice}₺)` : ''}`).join(' • ')}</p>
                                 )}
                                 {item.selectedOptions?.length > 0 && (
                                    <p>Opsiyonlar: {item.selectedOptions.map(opt => `${opt.name} (+${opt.price.toFixed(2)} ₺)`).join(', ')}</p>
                                 )}
                              </div>

                              {hasDiscount && (
                                 <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'var(--color-danger-light, #fff0f0)',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.8rem',
                                    marginBottom: '0.5rem'
                                 }}>
                                    <span style={{ color: 'var(--color-danger)', fontWeight: 'var(--font-weight-semibold)' }}>
                                       %{item.discount.discountPercentage} İndirim
                                    </span>
                                 </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                       onClick={() => updateQuantity(item.productId, item.variationSelections, item.quantity - 1)}
                                       className="btn-icon"
                                       disabled={item.quantity <= 1}
                                    >
                                       <Minus size={16} />
                                    </button>
                                    <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 'var(--font-weight-semibold)' }}>
                                       {item.quantity}
                                    </span>
                                    <button
                                       onClick={() => updateQuantity(item.productId, item.variationSelections, item.quantity + 1)}
                                       className="btn-icon"
                                    >
                                       <Plus size={16} />
                                    </button>
                                 </div>

                                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                       {hasDiscount ? (
                                          <>
                                             <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                                                {basePrice.toFixed(2)} ₺ x {item.quantity}
                                             </p>
                                             <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {finalPrice.toFixed(2)} ₺ x {item.quantity}
                                             </p>
                                          </>
                                       ) : (
                                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                             {finalPrice.toFixed(2)} ₺ x {item.quantity}
                                          </p>
                                       )}
                                       <p style={{ fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                                          {itemTotal.toFixed(2)} ₺
                                       </p>
                                    </div>
                                    <button
                                       onClick={() => removeFromCart(item.productId, item.variationSelections)}
                                       className="btn-icon btn-danger"
                                       title="Sil"
                                    >
                                       <Trash2 size={18} />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>

            <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
               <h3 style={{ marginBottom: '1rem' }}>Sipariş Özeti</h3>

               <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span>Ürün Sayısı:</span>
                     <strong>{cart.totalItems} adet</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span>Ara Toplam:</span>
                     <span>{subtotal.toFixed(2)} ₺</span>
                  </div>
                  {totalDiscount > 0 && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-danger)' }}>
                        <span>İndirim:</span>
                        <span>-{totalDiscount.toFixed(2)} ₺</span>
                     </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                     <span>KDV:</span>
                     <span>{totalVat.toFixed(2)} ₺</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                     <span>Kargo:</span>
                     <strong style={{ color: shippingCost === 0 ? 'var(--color-success)' : 'inherit' }}>
                        {shippingCost === 0 ? 'Ücretsiz' : `${shippingCost.toFixed(2)} ₺`}
                     </strong>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)', marginBottom: '1.5rem' }}>
                  <span>Toplam:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{(grandTotal + shippingCost).toFixed(2)} ₺</span>
               </div>

               {shippingSettings && shippingSettings.freeShippingEnabled && grandTotal < shippingSettings.freeShippingThreshold && (
                  <div style={{
                     padding: '0.75rem',
                     background: 'var(--color-bg-secondary)',
                     borderRadius: 'var(--radius-md)',
                     fontSize: '0.875rem',
                     textAlign: 'center',
                     marginBottom: '1rem'
                  }}>
                     {shippingSettings.freeShippingThreshold.toFixed(0)} ₺ üzeri siparişlerde <strong>ücretsiz kargo!</strong>
                     <br />
                     <span style={{ color: 'var(--color-text-secondary)' }}>
                        {(shippingSettings.freeShippingThreshold - grandTotal).toFixed(2)} ₺ daha ekleyin
                     </span>
                  </div>
               )}

               <Link to="/checkout" className="btn btn-primary btn-block" style={{ marginBottom: '0.75rem' }}>
                  Sipariş Ver
               </Link>
               <Link to="/" className="btn btn-secondary btn-block">
                  Alışverişe Devam Et
               </Link>
            </div>
         </div>
      </div>
   );
};

export default Cart;