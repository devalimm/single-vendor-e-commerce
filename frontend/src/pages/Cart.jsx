import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

const Cart = () => {
   const { cart, removeFromCart, updateQuantity } = useCart();

   const calculateItemPrice = (item) => {
      let price = item.basePrice;

      if (item.selectedLength?.priceAdjustment) {
         price += item.selectedLength.priceAdjustment;
      }

      if (item.selectedOptions?.length > 0) {
         item.selectedOptions.forEach(option => {
            price += option.price || 0;
         });
      }

      return price;
   };

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
            {/* Cart Items */}
            <div>
               {cart.items.map((item, index) => {
                  const itemPrice = calculateItemPrice(item);
                  const itemTotal = itemPrice * item.quantity;

                  return (
                     <div key={index} className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                           {/* Product Image */}
                           <img
                              src={item.image ? `http://localhost:5000${item.image}` : 'https://via.placeholder.com/100'}
                              alt={item.name}
                              style={{ width: '100px', height: '133px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                           />

                           {/* Product Info */}
                           <div style={{ flex: 1 }}>
                              <h3 style={{ marginBottom: '0.5rem' }}>{item.name}</h3>

                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                 {item.selectedSize && (
                                    <p>Beden: <strong>{item.selectedSize.name}</strong></p>
                                 )}
                                 {item.selectedLength && (
                                    <p>Boy: <strong>{item.selectedLength.name}</strong>
                                       {item.selectedLength.priceAdjustment > 0 && ` (+${item.selectedLength.priceAdjustment.toFixed(2)} ₺)`}
                                    </p>
                                 )}
                                 {item.selectedOptions?.length > 0 && (
                                    <p>Opsiyonlar: {item.selectedOptions.map(opt => `${opt.name} (+${opt.price.toFixed(2)} ₺)`).join(', ')}</p>
                                 )}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 {/* Quantity Controls */}
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                       onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedLength, item.quantity - 1)}
                                       className="btn-icon"
                                       disabled={item.quantity <= 1}
                                    >
                                       <Minus size={16} />
                                    </button>
                                    <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 'var(--font-weight-semibold)' }}>
                                       {item.quantity}
                                    </span>
                                    <button
                                       onClick={() => updateQuantity(item.productId, item.selectedSize, item.selectedLength, item.quantity + 1)}
                                       className="btn-icon"
                                    >
                                       <Plus size={16} />
                                    </button>
                                 </div>

                                 {/* Price & Remove */}
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                       <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                          {itemPrice.toFixed(2)} ₺ x {item.quantity}
                                       </p>
                                       <p style={{ fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                                          {itemTotal.toFixed(2)} ₺
                                       </p>
                                    </div>
                                    <button
                                       onClick={() => removeFromCart(item.productId, item.selectedSize, item.selectedLength)}
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

            {/* Cart Summary */}
            <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
               <h3 style={{ marginBottom: '1rem' }}>Sipariş Özeti</h3>

               <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span>Ürün Sayısı:</span>
                     <strong>{cart.totalItems} adet</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span>Ara Toplam:</span>
                     <strong>{cart.totalPrice.toFixed(2)} ₺</strong>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)', marginBottom: '1.5rem' }}>
                  <span>Toplam:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{cart.totalPrice.toFixed(2)} ₺</span>
               </div>

               <button className="btn btn-primary btn-block" style={{ marginBottom: '0.75rem' }}>
                  Sipariş Ver
               </button>
               <Link to="/" className="btn btn-secondary btn-block">
                  Alışverişe Devam Et
               </Link>
            </div>
         </div>
      </div>
   );
};

export default Cart;
