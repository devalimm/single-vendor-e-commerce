import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail } from 'lucide-react';

const ForgotPassword = () => {
   const [email, setEmail] = useState('');
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState('');
   const [error, setError] = useState('');

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setMessage('');
      setLoading(true);

      try {
         const response = await api.post('/auth/forgot-password', { email });
         setMessage(response.data.message);
         setEmail('');
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
                  <Mail size={30} color="white" />
               </div>
               <h1>Şifremi Unuttum</h1>
               <p>Email adresinizi girin, size şifre sıfırlama linki gönderelim.</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
               <div className="form-group">
                  <label htmlFor="email">Email Adresi</label>
                  <input
                     type="email"
                     id="email"
                     className="form-input"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                     placeholder="ornek@email.com"
                     disabled={loading}
                  />
               </div>

               <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
               >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
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

export default ForgotPassword;
