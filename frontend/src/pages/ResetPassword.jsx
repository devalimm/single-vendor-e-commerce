import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock } from 'lucide-react';

const ResetPassword = () => {
   const { token } = useParams();
   const navigate = useNavigate();
   const [formData, setFormData] = useState({
      password: '',
      confirmPassword: ''
   });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

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
         const response = await api.put(`/auth/reset-password/${token}`, {
            password: formData.password
         });

         // Show success message
         alert(response.data.message);

         // Redirect to login
         navigate('/login');
      } catch (err) {
         setError(err.response?.data?.message || 'Bir hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="auth-container">
         <div className="auth-card">
            <div className="auth-header">
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
               <h1>Yeni Şifre Belirle</h1>
               <p>Hesabınız için yeni bir şifre oluşturun.</p>
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
   );
};

export default ResetPassword;
