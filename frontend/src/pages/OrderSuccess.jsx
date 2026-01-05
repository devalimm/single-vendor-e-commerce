import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Home, Package } from 'lucide-react';

const OrderSuccess = () => {
   const location = useLocation();
   const orderId = location.state?.orderId;

   return (
      <div className="container" style={{
         padding: '4rem 0',
         textAlign: 'center',
         maxWidth: '600px',
         margin: '0 auto'
      }}>
         <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-success), #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
         }}>
            <CheckCircle size={50} color="white" />
         </div>

         <h1 style={{ marginBottom: '1rem', color: 'var(--color-success)' }}>
            Siparişiniz Alındı!
         </h1>

         <p style={{
            color: 'var(--color-text-secondary)',
            marginBottom: '2rem',
            fontSize: '1.125rem',
            lineHeight: '1.6'
         }}>
            Siparişiniz başarıyla oluşturuldu. En kısa sürede sizinle iletişime geçeceğiz.
         </p>

         {orderId && (
            <div style={{
               background: 'var(--color-bg-secondary)',
               padding: '1.25rem',
               borderRadius: 'var(--radius-lg)',
               marginBottom: '2rem'
            }}>
               <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Sipariş Numaranız
               </p>
               <p style={{
                  fontFamily: 'monospace',
                  fontSize: '1.125rem',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-primary)'
               }}>
                  #{orderId.slice(-8).toUpperCase()}
               </p>
            </div>
         )}

         <div style={{
            background: 'var(--color-bg-tertiary)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '2rem',
            textAlign: 'left'
         }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Package size={20} />
               Sonraki Adımlar
            </h3>
            <ul style={{
               listStyle: 'none',
               padding: 0,
               margin: 0,
               color: 'var(--color-text-secondary)'
            }}>
               <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>1.</span>
                  Siparişiniz onay için değerlendirilecek
               </li>
               <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>2.</span>
                  Onaylandıktan sonra hazırlık sürecine girecek
               </li>
               <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>3.</span>
                  Kargo takip numarası e-posta ile gönderilecek
               </li>
            </ul>
         </div>

         <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={18} />
            Anasayfaya Dön
         </Link>
      </div>
   );
};

export default OrderSuccess;
