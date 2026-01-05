import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
   const currentYear = new Date().getFullYear();

   return (
      <footer style={{
         background: 'var(--color-bg-secondary)',
         borderTop: '1px solid var(--color-border)',
         marginTop: '4rem',
         paddingTop: '3rem',
         paddingBottom: '1.5rem'
      }}>
         <div className="container">
            <div style={{
               display: 'grid',
               gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
               gap: '2rem',
               marginBottom: '2rem'
            }}>
               {/* Brand */}
               <div>
                  <h3 style={{
                     fontSize: '1.5rem',
                     fontWeight: 'var(--font-weight-bold)',
                     marginBottom: '1rem',
                     color: 'var(--color-primary)'
                  }}>
                     Asiye Özel
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '0.9rem' }}>
                     Şıklığı ve zerafeti bir arada sunan özel tasarım kıyafetler.
                  </p>
               </div>

               {/* Quick Links */}
               <div>
                  <h4 style={{ marginBottom: '1rem', fontWeight: 'var(--font-weight-semibold)' }}>
                     Hızlı Linkler
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                     <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           Ana Sayfa
                        </Link>
                     </li>
                     <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/products" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           Ürünler
                        </Link>
                     </li>
                     <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/orders" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           Sipariş Takibi
                        </Link>
                     </li>
                     <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/cart" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           Sepetim
                        </Link>
                     </li>
                  </ul>
               </div>

               {/* Legal */}
               <div>
                  <h4 style={{ marginBottom: '1rem', fontWeight: 'var(--font-weight-semibold)' }}>
                     Sözleşmeler
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                     <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/mesafeli-satis-sozlesmesi" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           Mesafeli Satış Sözleşmesi
                        </Link>
                     </li>
                     <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/kvkk" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           Gizlilik ve Güvenlik (KVKK)
                        </Link>
                     </li>
                  </ul>
               </div>

               {/* Contact */}
               <div>
                  <h4 style={{ marginBottom: '1rem', fontWeight: 'var(--font-weight-semibold)' }}>
                     İletişim
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                     <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} style={{ color: 'var(--color-primary)' }} />
                        <a href="mailto:info@asiyeozel.com" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           info@asiyeozel.com
                        </a>
                     </li>
                     <li style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={16} style={{ color: 'var(--color-primary)' }} />
                        <a href="tel:+905551234567" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                           +90 555 123 45 67
                        </a>
                     </li>
                     <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <MapPin size={16} style={{ color: 'var(--color-primary)', marginTop: '2px' }} />
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                           İstanbul, Türkiye
                        </span>
                     </li>
                  </ul>

                  {/* Social Media */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                     <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                        style={{
                           color: 'var(--color-text-secondary)',
                           transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'}
                        onMouseOut={(e) => e.target.style.color = 'var(--color-text-secondary)'}
                     >
                        <Instagram size={22} />
                     </a>
                     <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                        style={{
                           color: 'var(--color-text-secondary)',
                           transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'}
                        onMouseOut={(e) => e.target.style.color = 'var(--color-text-secondary)'}
                     >
                        <Facebook size={22} />
                     </a>
                  </div>
               </div>
            </div>

            {/* Copyright */}
            <div style={{
               borderTop: '1px solid var(--color-border)',
               paddingTop: '1.5rem',
               textAlign: 'center',
               color: 'var(--color-text-muted)',
               fontSize: '0.875rem'
            }}>
               <p>© {currentYear} Asiye Özel. Tüm hakları saklıdır.</p>
            </div>
         </div>
      </footer>
   );
};

export default Footer;
