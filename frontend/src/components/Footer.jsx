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
                           Samsun, Türkiye
                        </span>
                     </li>
                  </ul>

                  {/* Social Media */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                     <a href="https://www.instagram.com/asiye.ozell/" target="_blank" rel="noopener noreferrer"
                        style={{
                           color: 'var(--color-text-secondary)',
                           transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'}
                        onMouseOut={(e) => e.target.style.color = 'var(--color-text-secondary)'}
                     >
                        <Instagram size={22} />
                     </a>
                     <a href="https://wa.me/905551234567" target="_blank" rel="noopener noreferrer"
                        style={{
                           color: 'var(--color-text-secondary)',
                           transition: 'color 0.2s',
                           display: 'inline-flex'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#25D366'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
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
