import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, User, MapPin, FileText, CreditCard, Loader, ChevronRight, ArrowLeft } from 'lucide-react';
import cities from '../data/cities.json';
import allDistricts from '../data/districts.json';
import { getImageUrl } from '../utils/api';
import { calculateItemTotals, calculateCartTotals, calculateShippingCost } from '../utils/pricing';
import { useShippingSettings } from '../hooks/useShippingSettings';
import { useCheckoutForm } from '../hooks/useCheckoutForm';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
    const { cart } = useCart();
    const { showToast } = useToast();

   const iyzipayFormRef = useRef(null);
   const [checkoutFormContent, setCheckoutFormContent] = useState(null);
   const [paymentLoading, setPaymentLoading] = useState(false);

   const { settings: shippingSettings } = useShippingSettings();
const {
       formData,
       errors,
       agreementAccepted,
       setAgreementAccepted,
       step,
       setStep,
       updateField,
       nextStep,
       prevStep
    } = useCheckoutForm();

   useEffect(() => {
      if (checkoutFormContent && iyzipayFormRef.current) {
         iyzipayFormRef.current.innerHTML = checkoutFormContent;
         const scripts = iyzipayFormRef.current.querySelectorAll('script');
         scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
               newScript.setAttribute(attr.name, attr.value);
            });
            if (oldScript.textContent) {
               newScript.textContent = oldScript.textContent;
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
         });
      }
   }, [checkoutFormContent]);

   const districts = useMemo(() => {
      if (!formData.city) return [];
      return allDistricts.filter(d => d.cityName === formData.city);
   }, [formData.city]);

   const handleInputChange = (e) => {
      updateField(e.target.name, e.target.value);
   };

const handleSubmit = async () => {
       if (!agreementAccepted) {
         showToast('Mesafeli Satış Sözleşmesini kabul etmelisiniz', 'error');
         return;
      }

      setPaymentLoading(true);

      try {
         const items = cart.items.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            variationSelections: item.variationSelections || [],
            selectedOptions: item.selectedOptions || []
         }));

         const paymentData = {
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
            customerNote: formData.customerNote || null
         };

         const response = await fetch(`${VITE_API_URL}/payment/initialize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
         });

         const data = await response.json();

if (data.success) {
             setCheckoutFormContent(data.data.checkoutFormContent);
             setStep(4);
          } else {
            showToast(data.message || 'Ödeme başlatılamadı', 'error');
         }
      } catch (error) {
         console.error('Payment init error:', error);
         showToast('Ödeme başlatılırken bir hata oluştu', 'error');
      } finally {
         setPaymentLoading(false);
      }
   };

   const { subtotal, totalVat, grandTotal, totalDiscount } = useMemo(() => {
      return calculateCartTotals(cart.items);
   }, [cart.items]);

   const shippingCost = useMemo(() => {
      return calculateShippingCost(shippingSettings, grandTotal, cart.totalItems);
   }, [shippingSettings, grandTotal, cart.totalItems]);

   const finalTotal = grandTotal + shippingCost;

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
      { number: 3, title: 'Sipariş Özeti', icon: FileText },
      { number: 4, title: 'Ödeme', icon: CreditCard }
   ];

   return (
      <div className="container" style={{ padding: '2rem 0' }}>
         <Link to="/cart" className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} />
            Sepete Dön
         </Link>

         <h1 style={{ marginBottom: '2rem' }}>Sipariş Oluştur</h1>

         <div className="checkout-steps" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
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
                     {step > s.number ? <CreditCard size={18} /> : <s.icon size={18} />}
                     <span className="hide-mobile">{s.title}</span>
                  </div>
                  {idx < steps.length - 1 && (
                     <ChevronRight size={20} style={{ margin: '0 0.5rem', color: 'var(--color-text-muted)' }} />
                  )}
               </div>
            ))}
         </div>

         <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
               {step === 1 && (
                  <div>
                     <h2 style={{ marginBottom: '1.5rem' }}>Müşteri Bilgileri</h2>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="fullName">Ad Soyad *</label>
                        <input
                           type="text" id="fullName" name="fullName"
                           value={formData.fullName} onChange={handleInputChange}
                           placeholder="Adınız ve soyadınız"
                           className={errors.fullName ? 'error' : ''}
                        />
                        {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="tcKimlik">TC Kimlik Numarası <small style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(Opsiyonel)</small></label>
                        <input
                           type="text" id="tcKimlik" name="tcKimlik"
                           value={formData.tcKimlik} onChange={handleInputChange}
                           placeholder="11 haneli TC kimlik numaranız"
                           maxLength={11}
                           className={errors.tcKimlik ? 'error' : ''}
                        />
                        {errors.tcKimlik && <span className="error-text">{errors.tcKimlik}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="email">E-posta Adresi *</label>
                        <input
                           type="email" id="email" name="email"
                           value={formData.email} onChange={handleInputChange}
                           placeholder="ornek@email.com"
                           className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="phone">Telefon Numarası *</label>
                        <input
                           type="number" id="phone" name="phone"
                           value={formData.phone} onChange={handleInputChange}
                           placeholder="05XX XXX XX XX"
                           className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                     </div>

<button onClick={() => nextStep()} className="btn btn-primary btn-block">
                         Devam Et <ChevronRight size={18} />
                      </button>
                  </div>
               )}

               {step === 2 && (
                  <div>
                     <h2 style={{ marginBottom: '1.5rem' }}>Adres Bilgileri</h2>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                           <label htmlFor="city">İl *</label>
                           <select
                              id="city" name="city"
                              value={formData.city} onChange={handleInputChange}
                              className={errors.city ? 'error' : ''}
                           >
                              <option value="">İl Seçiniz</option>
                              {cities.map(city => (
                                 <option key={city.id} value={city.cityName}>{city.cityName}</option>
                              ))}
                           </select>
                           {errors.city && <span className="error-text">{errors.city}</span>}
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                           <label htmlFor="district">İlçe *</label>
                           <select
                              id="district" name="district"
                              value={formData.district} onChange={handleInputChange}
                              disabled={!formData.city}
                              className={errors.district ? 'error' : ''}
                           >
                              <option value="">İlçe Seçiniz</option>
                              {districts.map(district => (
                                 <option key={district.id} value={district.districtName}>{district.districtName}</option>
                              ))}
                           </select>
                           {errors.district && <span className="error-text">{errors.district}</span>}
                        </div>
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="neighborhood">Mahalle *</label>
                        <input
                           type="text" id="neighborhood" name="neighborhood"
                           value={formData.neighborhood} onChange={handleInputChange}
                           placeholder="Mahalle adı giriniz"
                           className={errors.neighborhood ? 'error' : ''}
                        />
                        {errors.neighborhood && <span className="error-text">{errors.neighborhood}</span>}
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="address">Açık Adres *</label>
                        <textarea
                           id="address" name="address"
                           value={formData.address} onChange={handleInputChange}
                           placeholder="Sokak, apartman, daire numarası..."
                           rows={3}
                           className={errors.address ? 'error' : ''}
                        />
                        {errors.address && <span className="error-text">{errors.address}</span>}
                     </div>

                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>
                           <ArrowLeft size={18} /> Geri
                        </button>
<button onClick={() => nextStep()} className="btn btn-primary" style={{ flex: 2 }}>
                            Devam Et <ChevronRight size={18} />
                         </button>
                     </div>
                  </div>
               )}

               {step === 3 && (
                  <div>
                     <h2 style={{ marginBottom: '1.5rem' }}>Sipariş Özeti</h2>

                     <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Müşteri Bilgileri</h4>
                        <p><strong>{formData.fullName}</strong></p>
                        <p>{formData.email} • {formData.phone}</p>
                     </div>

                     <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Teslimat Adresi</h4>
                        <p>{formData.neighborhood}, {formData.district}/{formData.city}</p>
                        <p>{formData.address}</p>
                     </div>

                     <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="customerNote">Sipariş Notu (Opsiyonel)</label>
                        <textarea
                           id="customerNote" name="customerNote"
                           value={formData.customerNote} onChange={handleInputChange}
                           placeholder="Siparişinizle ilgili eklemek istediğiniz notlar..."
                           rows={3}
                        />
                     </div>

                     <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Ürünler</h4>
                        {cart.items.map((item, index) => {
                           const { basePrice, finalPrice, hasDiscount } = calculateItemTotals(item);
                           return (
                              <div key={index} style={{
                                 display: 'flex', gap: '1rem', padding: '0.75rem 0',
                                 borderBottom: index < cart.items.length - 1 ? '1px solid var(--color-border)' : 'none'
                              }}>
                                 <img
                                    src={item.image ? getImageUrl(item.image) : 'https://via.placeholder.com/60'}
                                    alt={item.name}
                                    style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                 />
                                 <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>{item.name}</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                       {item.variationSelections?.map(s => `${s.variationName}: ${s.optionName}`).join(' • ')}
                                    </p>
                                    {hasDiscount ? (
                                       <>
                                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                                             {basePrice.toFixed(2)} ₺
                                          </p>
                                          <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>
                                             {finalPrice.toFixed(2)} ₺ x {item.quantity}
                                          </p>
                                       </>
                                    ) : (
                                       <p style={{ fontSize: '0.875rem' }}>{finalPrice.toFixed(2)} ₺ x {item.quantity}</p>
                                    )}
                                 </div>
                                 <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                                    {(finalPrice * item.quantity).toFixed(2)} ₺
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                           <input
                              type="checkbox"
                              checked={agreementAccepted}
                              onChange={(e) => setAgreementAccepted(e.target.checked)}
                              style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
                           />
                           <span style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                              <a href="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                                 Mesafeli Satış Sözleşmesi
                              </a>'ni okudum ve kabul ediyorum.
                           </span>
                        </label>
                     </div>

                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>
                           <ArrowLeft size={18} /> Geri
                        </button>
<button
                            onClick={handleSubmit}
                            className="btn btn-primary"
                            style={{ flex: 2 }}
                            disabled={paymentLoading || !agreementAccepted}
                         >
                           {paymentLoading ? 'Yükleniyor...' : 'Ödemeye Geç'}
                           <CreditCard size={18} />
                        </button>
                     </div>
                  </div>
               )}

               {step === 4 && (
                  <div>
                     <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={24} />
                        Kredi Kartı ile Ödeme
                     </h2>
                     <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                        Lütfen kart bilgilerinizi girerek ödemenizi tamamlayın.
                     </p>
                     {checkoutFormContent ? (
                        <div id="iyzipay-checkout-form" className="iyzico-form-container" ref={iyzipayFormRef} />
                     ) : (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                           <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                           <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>Ödeme formu yükleniyor...</p>
                        </div>
                     )}
                     <button onClick={() => { prevStep(); setCheckoutFormContent(null); }} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
                        <ArrowLeft size={18} /> Geri Dön
                     </button>
                  </div>
               )}
            </div>

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
                        {shippingCost === 0 ? 'Ücretsiz' : `${shippingCost.toFixed(2)} ₺`}
                     </strong>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'var(--font-weight-bold)' }}>
                  <span>Toplam:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{finalTotal.toFixed(2)} ₺</span>
               </div>

               {shippingSettings && shippingSettings.freeShippingEnabled && grandTotal < shippingSettings.freeShippingThreshold && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', textAlign: 'center' }}>
                     {shippingSettings.freeShippingThreshold.toFixed(0)} ₺ üzeri siparişlerde <strong>ücretsiz kargo!</strong>
                     <br />
                     <span style={{ color: 'var(--color-text-secondary)' }}>
                        {(shippingSettings.freeShippingThreshold - grandTotal).toFixed(2)} ₺ daha ekleyin
                     </span>
                  </div>
               )}
            </div>
         </div>

         <style>{`
            @media (max-width: 900px) {
               .checkout-layout { grid-template-columns: 1fr !important; }
               .hide-mobile { display: none; }
            }
            .form-group label {
               display: block; margin-bottom: 0.5rem;
               font-weight: var(--font-weight-medium);
            }
            .form-group input, .form-group select, .form-group textarea {
               width: 100%; padding: 0.75rem 1rem;
               border: 1px solid var(--color-border);
               border-radius: var(--radius-md);
               font-size: 1rem;
               background: var(--color-bg-primary);
               color: var(--color-text-primary);
               transition: border-color 0.2s;
            }
            .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
               outline: none; border-color: var(--color-primary);
            }
            .form-group input.error, .form-group select.error, .form-group textarea.error {
               border-color: var(--color-danger);
            }
            .error-text {
               display: block; color: var(--color-danger);
               font-size: 0.875rem; margin-top: 0.25rem;
            }
            .form-group select:disabled { opacity: 0.6; cursor: not-allowed; }
         `}</style>
      </div>
   );
};

export default Checkout;