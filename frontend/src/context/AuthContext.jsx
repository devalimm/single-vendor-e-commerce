import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
   const context = useContext(AuthContext);
   if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
};

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [token, setToken] = useState(localStorage.getItem('token'));

   // Load user from token on mount
   useEffect(() => {
      const loadUser = async () => {
         const storedToken = localStorage.getItem('token');
         if (storedToken) {
            try {
               const response = await api.get('/auth/profile');
               setUser(response.data.data);
            } catch (error) {
               console.error('Failed to load user:', error);
               localStorage.removeItem('token');
               setToken(null);
            }
         }
         setLoading(false);
      };

      loadUser();
   }, []);

   const register = async (name, email, password) => {
      try {
         const response = await api.post('/auth/register', {
            name,
            email,
            password
         });

         const { token: newToken, ...userData } = response.data.data;

         localStorage.setItem('token', newToken);
         setToken(newToken);
         setUser(userData);

         return { success: true };
      } catch (error) {
         return {
            success: false,
            message: error.response?.data?.message || 'Kayıt başarısız oldu.'
         };
      }
   };

   const login = async (email, password) => {
      try {
         const response = await api.post('/auth/login', {
            email,
            password
         });

         const { token: newToken, ...userData } = response.data.data;

         localStorage.setItem('token', newToken);
         setToken(newToken);
         setUser(userData);

         return { success: true };
      } catch (error) {
         return {
            success: false,
            message: error.response?.data?.message || 'Giriş başarısız oldu.'
         };
      }
   };

   const logout = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
   };

   const updateUser = (updatedData) => {
      setUser(prev => ({ ...prev, ...updatedData }));
   };

   const isAdmin = () => {
      return user?.role === 'admin';
   };

   const value = {
      user,
      token,
      loading,
      register,
      login,
      logout,
      updateUser,
      isAdmin,
      isAuthenticated: !!user
   };

   return (
      <AuthContext.Provider value={value}>
         {children}
      </AuthContext.Provider>
   );
};
