import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, User, MapPin, FileText, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import turkeyAddresses from '../data/turkeyAddresses.json';
const VITE_API_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
   const navigate = useNavigate();
   const { cart, clearCart } = useCart();
   const { showToast } = useToast();

   const [step, setStep] = useState(1);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Form state
   const [formData, setFormData] = useState({
      fullName: '',
      tcKimlik: '',
      email: '',
      phone: '',
      city: '',
      district: '',
      neighborhood: '',
      address: '',
      customerNote: ''
   });

   const [errors, setErrors] = useState({});
   const [agreementAccepted, setAgreementAccepted] = useState(false);

   // Get districts based on selected city
   const districts = useMemo(() => {
      if (!formData.city) return [];
      const province = turkeyAddresses.provinces.find(p => p.name === formData.city);
      return province?.districts || [];
   }, [formData.city]);

   // Get neighborhoods based on selected district
   const neighborhoods = useMemo(() => {
      if (!formData.district) return [];
      const province = turkeyAddresses.provinces.find(p => p.name === formData.city);
      const district = province?.districts.find(d => d.name === formData.district);
      return district?.neighborhoods || [];
   }, [formData.city, formData.district]);

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => {
         const newData = { ...prev, [name]: value };

         // Reset dependent fields when city/district changes
         if (name === 'city') {
            newData.district = '';
            newData.neighborhood = '';
         } else if (name === 'district') {
            newData.neighborhood = '';
         }

         return newData;
      });

      // Clear error when user types
      if (errors[name]) {
         setErrors(prev => ({ ...prev, [name]: '' }));
      }
   };

   const validateStep = (stepNumber) => {
      const newErrors = {};

      if (stepNumber === 1) {
         if (!formData.fullName.trim()) newErrors.fullName = 'Ad Soyad gereklidir';
         if (!formData.tcKimlik.trim()) {
            newErrors.tcKimlik = 'TC Kimlik numarası gereklidir';
         } else if (!/^\d{11}$/.test(formData.tcKimlik)) {
            newErrors.tcKimlik = 'TC Kimlik numarası 11 haneli olmalıdır';
         }
         if (!formData.email.trim()) {
            newErrors.email = 'E-posta gereklidir';
         } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Geçerli bir e-posta adresi giriniz';
         }
         if (!formData.phone.trim()) {
            newErrors.phone = 'Telefon numarası gereklidir';
         }
      } else if (stepNumber === 2) {
         if (!formData.city) newErrors.city = 'İl seçimi gereklidir';
         if (!formData.district) newErrors.district = 'İlçe seçimi gereklidir';
         if (!formData.neighborhood) newErrors.neighborhood = 'Mahalle seçimi gereklidir';
         if (!formData.address.trim()) newErrors.address = 'Açık adres gereklidir';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   const nextStep = () => {
      if (validateStep(step)) {
         setStep(prev => prev + 1);
      }
   };

   const prevStep = () => {
      setStep(prev => prev - 1);
   };

   const calculateItemBasePrice = (item) => {
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

   const calculateItemPrice = (item) => {
      let price = calculateItemBasePrice(item);
      if (item.discount) {
         if (item.discount.type === 'percentage') {
            price = price * (1 - item.discount.value / 100);
         } else {
            price = Math.max(0, price - item.discount.value);
         }
      }
      return price;
   };

   const handleSubmit = async () => {
      if (!validateStep(3)) return;

      setIsSubmitting(true);

      try {
         // Prepare order items for API
         const items = cart.items.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            size: item.selectedSize?.name || 'Standart',
            length: item.selectedLength?.name || null,
            selectedOptions: item.selectedOptions || []
         }));

         const orderData = {
            items,
            shippingAddress: {
               fullName: formData.fullName,
               tcKimlik: formData.tcKimlik,
               email: formData.email,
               phone: formData.phone,
               city: formData.city,
               district: formData.district,
               neighborhood: formData.neighborhood,
               address: formData.address
            },
            customerNote: formData.customerNote || null,
            paymentMethod: 'cash_on_delivery'
         };

         const response = await fetch(`${VITE_API_URL}/orders/guest`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
         });

         const data = await response.json();

         if (data.success) {
            clearCart();
            showToast('Siparişiniz başarıyla oluşturuldu!', 'success');
            navigate('/order-success', { state: { orderId: data.data._id } });
         } else {
            showToast(data.message || 'Sipariş oluşturulamadı', 'error');
         }
      } catch (error) {
         console.error('Order error:', error);
         showToast('Sipariş oluşturulurken bir hata oluştu', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Calculate VAT breakdown
   const { subtotal, totalVat, grandTotal, totalDiscount } = useMemo(() => {
      let subtotal = 0;
      let totalVat = 0;
      let totalDiscount = 0;

      cart.items.forEach(item => {
         const basePrice = calculateItemBasePrice(item);
         const itemPrice = calculateItemPrice(item);
         const itemTotal = itemPrice * item.quantity;
         const vatRate = item.vatRate || 20;

         totalDiscount += (basePrice - itemPrice) * item.quantity;

         const priceWithoutVat = itemTotal / (1 + vatRate / 100);
         const vatAmount = itemTotal - priceWithoutVat;

         subtotal += priceWithoutVat;
         totalVat += vatAmount;
      });

      return {
         subtotal,
         totalVat,
         grandTotal: subtotal + totalVat,
         totalDiscount
      };
   }, [cart.items]);

   const shippingCost = grandTotal > 500 ? 0 : 30;
   const finalTotal = grandTotal + shippingCost;

   // Redirect if cart is empty
   if (cart.items.length === 0) {
      return (
         <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
            <ShoppingBag size={64} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h2>Sepetiniz Boş</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
               Sipariş vermek için sepetinize ürün ekleyin
            </p>
            <Link to="/" className="btn btn-primary">
               Alışverişe Başla
            </Link>
         </div>
      );
   }

   const steps = [
      { number: 1, title: 'Müşteri Bilgileri', icon: User },
      { number: 2, title: 'Adres Bilgileri', icon: MapPin },
      { number: 3, title: 'Sipariş Özeti', icon: FileText }
   ];

   return (
      <div className="container" style={{ padding: '2rem 0' }}>
         {/* Back Button */}
         <Link to="/cart" className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} />
            Sepete Dön
         </Link>

         <h1 style={{ marginBottom: '2rem' }}>Sipariş Oluştur</h1>

         {/* Progress Steps */}
         <div className="checkout-steps" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2.5rem'
         }}>
            {steps.map((s, idx) => (
               <div key={s.number} style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                     style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        background: step >= s.number ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                        color: step >= s.number ? 'white' : 'var(--color-text-secondary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        transition: 'all 0.3s ease'
                     }}
                  >
                     {step > s.number ? (
                        <Check size={18} />
                     ) : (
                        <s.icon size={18} />
                     )}
                     <span className="hide-mobile">{s.title}</span>
                  </div>
                  {idx < steps.length - 1 && (
                     <ChevronRight size={20} style={{ margin: '0 0.5rem', color: 'var(--color-text-muted)' }} />
                  )}
               </div>
            ))}
         </div>

         <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
            {/* Form Section */}
            <div className="card" style={{ padding: '2rem' }}>
               {/* Step 1: Customer Info */}
               {step === 1 && (
                  <div>
                     <h2 style={{ marginBottom: '1.5rem' }}>Müşteri Bilgileri</h2>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="fullName">Ad Soyad *</label>
                        <input
                           type="text"
                           id="fullName"
                           name="fullName"
                           value={formData.fullName}
                           onChange={handleInputChange}
                           placeholder="Adınız ve soyadınız"
                           className={errors.fullName ? 'error' : ''}
                        />
                        {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="tcKimlik">TC Kimlik Numarası *</label>
                        <input
                           type="text"
                           id="tcKimlik"
                           name="tcKimlik"
                           value={formData.tcKimlik}
                           onChange={handleInputChange}
                           placeholder="11 haneli TC kimlik numaranız"
                           maxLength={11}
                           className={errors.tcKimlik ? 'error' : ''}
                        />
                        {errors.tcKimlik && <span className="error-text">{errors.tcKimlik}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="email">E-posta Adresi *</label>
                        <input
                           type="email"
                           id="email"
                           name="email"
                           value={formData.email}
                           onChange={handleInputChange}
                           placeholder="ornek@email.com"
                           className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="phone">Telefon Numarası *</label>
                        <input
                           type="tel"
                           id="phone"
                           name="phone"
                           value={formData.phone}
                           onChange={handleInputChange}
                           placeholder="05XX XXX XX XX"
                           className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                     </div>

                     <button onClick={nextStep} className="btn btn-primary btn-block">
                        Devam Et
                        <ChevronRight size={18} />
                     </button>
                  </div>
               )}

               {/* Step 2: Address */}
               {step === 2 && (
                  <div>
                     <h2 style={{ marginBottom: '1.5rem' }}>Adres Bilgileri</h2>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                           <label htmlFor="city">İl *</label>
                           <select
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className={errors.city ? 'error' : ''}
                           >
                              <option value="">İl Seçiniz</option>
                              {turkeyAddresses.provinces.map(province => (
                                 <option key={province.name} value={province.name}>
                                    {province.name}
                                 </option>
                              ))}
                           </select>
                           {errors.city && <span className="error-text">{errors.city}</span>}
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                           <label htmlFor="district">İlçe *</label>
                           <select
                              id="district"
                              name="district"
                              value={formData.district}
                              onChange={handleInputChange}
                              disabled={!formData.city}
                              className={errors.district ? 'error' : ''}
                           >
                              <option value="">İlçe Seçiniz</option>
                              {districts.map(district => (
                                 <option key={district.name} value={district.name}>
                                    {district.name}
                                 </option>
                              ))}
                           </select>
                           {errors.district && <span className="error-text">{errors.district}</span>}
                        </div>
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="neighborhood">Mahalle *</label>
                        <select
                           id="neighborhood"
                           name="neighborhood"
                           value={formData.neighborhood}
                           onChange={handleInputChange}
                           disabled={!formData.district}
                           className={errors.neighborhood ? 'error' : ''}
                        >
                           <option value="">Mahalle Seçiniz</option>
                           {neighborhoods.map(neighborhood => (
                              <option key={neighborhood} value={neighborhood}>
                                 {neighborhood}
                              </option>
                           ))}
                        </select>
                        {errors.neighborhood && <span className="error-text">{errors.neighborhood}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="address">Açık Adres *</label>
                        <textarea
                           id="address"
                           name="address"
                           value={formData.address}
                           onChange={handleInputChange}
                           placeholder="Sokak, apartman, daire numarası..."
                           rows={3}
                           className={errors.address ? 'error' : ''}
                        />
                        {errors.address && <span className="error-text">{errors.address}</span>}
                     </div>

                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>
                           <ArrowLeft size={18} />
                           Geri
                        </button>
                        <button onClick={nextStep} className="btn btn-primary" style={{ flex: 2 }}>
                           Devam Et
                           <ChevronRight size={18} />
                        </button>
                     </div>
                  </div>
               )}

               {/* Step 3: Order Summary & Note */}
               {step === 3 && (
                  <div>
                     <h2 style={{ marginBottom: '1.5rem' }}>Sipariş Özeti</h2>

                     {/* Customer Info Summary */}
                     <div style={{
                        background: 'var(--color-bg-secondary)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                     }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Müşteri Bilgileri</h4>
                        <p><strong>{formData.fullName}</strong></p>
                        <p>{formData.email} • {formData.phone}</p>
                     </div>

                     {/* Address Summary */}
                     <div style={{
                        background: 'var(--color-bg-secondary)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem'
                     }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Teslimat Adresi</h4>
                        <p>{formData.neighborhood}, {formData.district}/{formData.city}</p>
                        <p>{formData.address}</p>
                     </div>

                     {/* Order Note */}
                     <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="customerNote">Sipariş Notu (Opsiyonel)</label>
                        <textarea
                           id="customerNote"
                           name="customerNote"
                           value={formData.customerNote}
                           onChange={handleInputChange}
                           placeholder="Siparişinizle ilgili eklemek istediğiniz notlar..."
                           rows={3}
                        />
                     </div>

                     {/* Cart Items */}
                     <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Ürünler</h4>
                        {cart.items.map((item, index) => {
                           const basePrice = calculateItemBasePrice(item);
                           const itemPrice = calculateItemPrice(item);
                           const hasDiscount = item.discount && itemPrice < basePrice;
                           return (
                              <div key={index} style={{
                                 display: 'flex',
                                 gap: '1rem',
                                 padding: '0.75rem 0',
                                 borderBottom: index < cart.items.length - 1 ? '1px solid var(--color-border)' : 'none'
                              }}>
                                 <img
                                    src={item.image ? `http://localhost:5000${item.image}` : 'https://via.placeholder.com/60'}
                                    alt={item.name}
                                    style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                 />
                                 <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>{item.name}</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                       {item.selectedSize?.name} {item.selectedLength && `• ${item.selectedLength.name}`}
                                    </p>
                                    {hasDiscount ? (
                                       <>
                                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                                             {basePrice.toFixed(2)} ₺
                                          </p>
                                          <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>
                                             {itemPrice.toFixed(2)} ₺ x {item.quantity}
                                          </p>
                                       </>
                                    ) : (
                                       <p style={{ fontSize: '0.875rem' }}>
                                          {itemPrice.toFixed(2)} ₺ x {item.quantity}
                                       </p>
                                    )}
                                 </div>
                                 <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                                    {(itemPrice * item.quantity).toFixed(2)} ₺
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     {/* Agreement Checkbox */}
                     <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)'
                     }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                           <input
                              type="checkbox"
                              checked={agreementAccepted}
                              onChange={(e) => setAgreementAccepted(e.target.checked)}
                              style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
                           />
                           <span style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                              <a
                                 href="/mesafeli-satis-sozlesmesi"
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                              >
                                 Mesafeli Satış Sözleşmesi
                              </a>
                              'ni okudum ve kabul ediyorum.
                           </span>
                        </label>
                     </div>

                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>
                           <ArrowLeft size={18} />
                           Geri
                        </button>
                        <button
                           onClick={handleSubmit}
                           className="btn btn-primary"
                           style={{ flex: 2 }}
                           disabled={isSubmitting || !agreementAccepted}
                        >
                           {isSubmitting ? 'İşleniyor...' : 'Siparişi Onayla'}
                           <Check size={18} />
                        </button>
                     </div>
                  </div>
               )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '2rem', height: 'fit-content' }}>
               <h3 style={{ marginBottom: '1rem' }}>Sipariş Toplamı</h3>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                     <span>KDV:</span>
                     <span>{totalVat.toFixed(2)} ₺</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span>Kargo:</span>
                     <strong style={{ color: shippingCost === 0 ? 'var(--color-success)' : 'inherit' }}>
                        {shippingCost === 0 ? 'Ücretsiz' : '30.00 ₺'}
                     </strong>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)' }}>
                  <span>Toplam:</span>
                  <span style={{ color: 'var(--color-primary)' }}>
                     {finalTotal.toFixed(2)} ₺
                  </span>
               </div>

               {/* {grandTotal <= 500 && (
                  <div style={{
                     marginTop: '1rem',
                     padding: '0.75rem',
                     background: 'var(--color-bg-secondary)',
                     borderRadius: 'var(--radius-md)',
                     fontSize: '0.875rem',
                     textAlign: 'center'
                  }}>
                     500 ₺ üzeri siparişlerde <strong>ücretsiz kargo!</strong>
                  </div>
               )} */}
            </div>
         </div>

         <style>{`
            @media (max-width: 900px) {
               .checkout-layout {
                  grid-template-columns: 1fr !important;
               }
               .hide-mobile {
                  display: none;
               }
            }
            .form-group label {
               display: block;
               margin-bottom: 0.5rem;
               font-weight: var(--font-weight-medium);
            }
            .form-group input,
            .form-group select,
            .form-group textarea {
               width: 100%;
               padding: 0.75rem 1rem;
               border: 1px solid var(--color-border);
               border-radius: var(--radius-md);
               font-size: 1rem;
               background: var(--color-bg-primary);
               color: var(--color-text-primary);
               transition: border-color 0.2s;
            }
            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
               outline: none;
               border-color: var(--color-primary);
            }
            .form-group input.error,
            .form-group select.error,
            .form-group textarea.error {
               border-color: var(--color-danger);
            }
            .error-text {
               display: block;
               color: var(--color-danger);
               font-size: 0.875rem;
               margin-top: 0.25rem;
            }
            .form-group select:disabled {
               opacity: 0.6;
               cursor: not-allowed;
            }
         `}</style>
      </div>
   );
};

export default Checkout;
