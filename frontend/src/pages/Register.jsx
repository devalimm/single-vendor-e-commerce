import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
   const [formData, setFormData] = useState({
      name: '',
      phone: '',
      password: '',
      confirmPassword: ''
   });
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);

   const { register } = useAuth();
   const navigate = useNavigate();

   const handleChange = (e) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value
      });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      // Validation
      if (formData.password !== formData.confirmPassword) {
         setError('Şifreler eşleşmiyor.');
         return;
      }

      if (formData.password.length < 6) {
         setError('Şifre en az 6 karakter olmalıdır.');
         return;
      }

      setLoading(true);

      const result = await register(formData.name, formData.phone, formData.password);

      if (result.success) {
         navigate('/');
      } else {
         setError(result.message);
      }

      setLoading(false);
   };

   return (
      <div className="auth-page">
         <div className="auth-container">
            <div className="auth-card">
               <h2 className="auth-title">Kayıt Ol</h2>
               <p className="auth-subtitle">Yeni hesap oluşturun</p>

               {error && (
                  <div className="alert alert-error">
                     {error}
                  </div>
               )}

               <form onSubmit={handleSubmit} className="auth-form">
                  <div className="form-group">
                     <label htmlFor="name">Ad Soyad</label>
                     <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Ad Soyad"
                        className="form-input"
                     />
                  </div>

                  <div className="form-group">
                     <label htmlFor="phone">Telefon Numarası</label>
                     <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
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
                           name="password"
                           value={formData.password}
                           onChange={handleChange}
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
                  </div>

                  <div className="form-group">
                     <label htmlFor="confirmPassword">Şifre Tekrar</label>
                     <div className="password-input-wrapper">
                        <input
                           type={showConfirmPassword ? 'text' : 'password'}
                           id="confirmPassword"
                           name="confirmPassword"
                           value={formData.confirmPassword}
                           onChange={handleChange}
                           required
                           placeholder="••••••••"
                           className="form-input"
                           minLength={6}
                        />
                        <button
                           type="button"
                           className="password-toggle-btn"
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           tabIndex={-1}
                        >
                           {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                     </div>
                  </div>

                  <button
                     type="submit"
                     className="btn btn-primary btn-block"
                     disabled={loading}
                  >
                     {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                  </button>
               </form>

               <div className="auth-footer">
                  <p>
                     Zaten hesabınız var mı?{' '}
                     <Link to="/login" className="auth-link">
                        Giriş Yap
                     </Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Register;
