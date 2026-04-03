import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock, CheckCircle, X } from 'lucide-react';

const ResetPassword = () => {
   const { token } = useParams();
   const navigate = useNavigate();
   const [formData, setFormData] = useState({
      password: '',
      confirmPassword: ''
   });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [showSuccessModal, setShowSuccessModal] = useState(false);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      if (formData.password !== formData.confirmPassword) {
         setError('Şifreler eşleşmiyor.');
         return;
      }

      if (formData.password.length < 6) {
         setError('Şifre en az 6 karakter olmalıdır.');
         return;
      }

      setLoading(true);

      try {
         await api.put(`/auth/reset-password/${token}`, {
            password: formData.password
         });

         setShowSuccessModal(true);
      } catch (err) {
         setError(err.response?.data?.message || 'Bir hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   const handleModalClose = () => {
      setShowSuccessModal(false);
      navigate('/login');
   };

   return (
      <div className="auth-page">
         <div className="auth-container">
            <div className="auth-card">
               <div className="auth-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                     width: '60px',
                     height: '60px',
                     background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                     borderRadius: '50%',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     margin: '0 auto 1rem'
                  }}>
                     <Lock size={30} color="white" />
                  </div>
                  <h2 className="auth-title">Yeni Şifre Belirle</h2>
                  <p className="auth-subtitle">Hesabınız için yeni bir şifre oluşturun.</p>
               </div>

               {error && <div className="alert alert-error">{error}</div>}

               <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                     <label htmlFor="password">Yeni Şifre</label>
                     <input
                        type="password"
                        id="password"
                        className="form-input"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="En az 6 karakter"
                        disabled={loading}
                     />
                  </div>

                  <div className="form-group">
                     <label htmlFor="confirmPassword">Şifre Tekrar</label>
                     <input
                        type="password"
                        id="confirmPassword"
                        className="form-input"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        placeholder="Şifrenizi tekrar girin"
                        disabled={loading}
                     />
                  </div>

                  <button
                     type="submit"
                     className="btn btn-primary btn-block"
                     disabled={loading}
                  >
                     {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
                  </button>
               </form>

               <div className="auth-footer">
                  <Link to="/login" className="auth-link">
                     ← Giriş sayfasına dön
                  </Link>
               </div>
            </div>
         </div>

         {/* Success Modal */}
         {showSuccessModal && (
            <div
               style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  animation: 'fadeIn 0.3s ease-out'
               }}
               onClick={handleModalClose}
            >
               <div
                  style={{
                     background: 'var(--color-surface)',
                     borderRadius: 'var(--radius-xl)',
                     padding: '2.5rem',
                     maxWidth: '420px',
                     width: '90%',
                     textAlign: 'center',
                     boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                     position: 'relative',
                     animation: 'fadeIn 0.3s ease-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
               >
                  <button
                     onClick={handleModalClose}
                     style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        padding: '0.25rem'
                     }}
                  >
                     <X size={20} />
                  </button>

                  <div style={{
                     width: '70px',
                     height: '70px',
                     background: 'linear-gradient(135deg, hsl(142, 71%, 45%), hsl(142, 71%, 55%))',
                     borderRadius: '50%',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     margin: '0 auto 1.5rem'
                  }}>
                     <CheckCircle size={36} color="white" />
                  </div>

                  <h3 style={{
                     fontSize: '1.5rem',
                     fontWeight: '700',
                     marginBottom: '0.75rem',
                     color: 'var(--color-text-primary)'
                  }}>
                     Şifreniz Güncellendi!
                  </h3>

                  <p style={{
                     color: 'var(--color-text-secondary)',
                     marginBottom: '1.5rem',
                     lineHeight: '1.6'
                  }}>
                     Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.
                  </p>

                  <button
                     onClick={handleModalClose}
                     className="btn btn-primary btn-block"
                     style={{ fontSize: '1rem', padding: '0.875rem' }}
                  >
                     Giriş Sayfasına Git
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};

export default ResetPassword;
