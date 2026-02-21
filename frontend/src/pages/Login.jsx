import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
   const [phone, setPhone] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);

   const { login } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();

   const from = location.state?.from?.pathname || '/';

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      const result = await login(phone, password);

      if (result.success) {
         navigate(from, { replace: true });
      } else {
         setError(result.message);
      }

      setLoading(false);
   };

   return (
      <div className="auth-page">
         <div className="auth-container">
            <div className="auth-card">
               <h2 className="auth-title">Giriş Yap</h2>
               <p className="auth-subtitle">Hesabınıza giriş yapın</p>

               {error && (
                  <div className="alert alert-error">
                     {error}
                  </div>
               )}

               <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                     <label htmlFor="phone">Telefon Numarası</label>
                     <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="05XX XXX XX XX"
                        className="form-input"
                     />
                  </div>

                  <div className="form-group">
                     <label htmlFor="password">Şifre</label>
                     <div className="password-input-wrapper">
                        <input
                           type={showPassword ? 'text' : 'password'}
                           id="password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           required
                           placeholder="••••••••"
                           className="form-input"
                           minLength={6}
                        />
                        <button
                           type="button"
                           className="password-toggle-btn"
                           onClick={() => setShowPassword(!showPassword)}
                           tabIndex={-1}
                        >
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                     </div>
                     <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                        <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.875rem' }}>
                           Şifremi Unuttum
                        </Link>
                     </div>
                  </div>

                  <button
                     type="submit"
                     className="btn btn-primary btn-block"
                     disabled={loading}
                  >
                     {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </button>
               </form>

               <div className="auth-footer">
                  <p>
                     Hesabınız yok mu?{' '}
                     <Link to="/register" className="auth-link">
                        Kayıt Ol
                     </Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Login;
