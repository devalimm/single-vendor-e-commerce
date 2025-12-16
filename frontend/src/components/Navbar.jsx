import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import { ShoppingCart, Package, Settings, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
   const { user, isAuthenticated, isAdmin, logout } = useAuth();
   const { cart, clearCart } = useCart();
   const navigate = useNavigate();
   const location = useLocation();
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

   // Hide cart on auth pages
   const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

   const handleLogout = () => {
      clearCart(); // Clear cart before logout
      logout();
      navigate('/');
      setMobileMenuOpen(false);
   };

   return (
      <nav className="navbar">
         <div className="container">
            <div className="navbar-content">
               {/* Logo */}
               <Link to="/" className="navbar-logo">
                  <div>
                     <h2 style={{ margin: 0, background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Asiye Özel
                     </h2>
                     <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                        Şık kadın giyim koleksiyonları
                     </p>
                  </div>
               </Link>

               {/* Desktop Navigation */}
               <div className="navbar-links desktop-only">
                  <Link to="/" className="nav-link">Ana Sayfa</Link>
                  <Link to="/products" className="nav-link">Ürünler</Link>

                  {isAuthenticated && (
                     <Link to="/orders" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={18} /> Siparişlerim
                     </Link>
                  )}

                  {isAdmin() && (
                     <Link to="/admin" className="nav-link admin-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={18} /> Admin Panel
                     </Link>
                  )}
               </div>

               {/* Auth Buttons & Cart */}
               <div className="navbar-auth" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Cart Icon - Hidden on auth pages */}
                  {!isAuthPage && (
                     <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <ShoppingCart size={24} style={{ color: 'var(--color-text-primary)' }} />
                        {cart.totalItems > 0 && (
                           <span style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: 'var(--color-primary)',
                              color: 'white',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'var(--font-weight-bold)'
                           }}>
                              {cart.totalItems}
                           </span>
                        )}
                     </Link>
                  )}

                  {/* Auth Buttons - Desktop only */}
                  <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     {isAuthenticated ? (
                        <div className="user-menu">
                           <span className="user-name">Merhaba, {user?.name}</span>
                           <button onClick={handleLogout} className="btn btn-outline btn-sm">
                              Çıkış
                           </button>
                        </div>
                     ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <Link to="/login" className="btn btn-outline btn-sm">
                              Giriş
                           </Link>
                           <Link to="/register" className="btn btn-primary btn-sm">
                              Kayıt Ol
                           </Link>
                        </div>
                     )}
                  </div>
               </div>

               {/* Mobile Menu Button */}
               <button
                  className="mobile-menu-btn mobile-only"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
               <div className="mobile-menu">
                  <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                     Ana Sayfa
                  </Link>
                  <Link to="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                     Ürünler
                  </Link>

                  {isAuthenticated && (
                     <>
                        <Link to="/cart" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <ShoppingCart size={18} /> Sepet
                        </Link>
                        <Link to="/orders" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <Package size={18} /> Siparişlerim
                        </Link>
                     </>
                  )}

                  {isAdmin() && (
                     <Link to="/admin" className="mobile-nav-link admin-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={18} /> Admin Panel
                     </Link>
                  )}
                  <div className="mobile-auth">
                     {isAuthenticated ? (
                        <>
                           <span className="user-name">Merhaba, {user?.name}</span>
                           <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%' }}>
                              Çıkış
                           </button>
                        </>
                     ) : (
                        <>
                           <Link to="/login" className="btn btn-outline" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                              Giriş
                           </Link>
                           <Link to="/register" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setMobileMenuOpen(false)}>
                              Kayıt Ol
                           </Link>
                        </>
                     )}
                  </div>
               </div>
            )}
         </div>
      </nav>
   );
};

export default Navbar;
