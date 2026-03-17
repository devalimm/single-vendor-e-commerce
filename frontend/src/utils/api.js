import axios from 'axios';

const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL || '/api',
   headers: {
      'Content-Type': 'application/json',
   },
});

/**
 * Görsel URL'i oluşturur.
 * VITE_API_URL = 'https://api.asiyeozel.com/api' → base = 'https://api.asiyeozel.com'
 * Lokalde (VITE_API_URL yok) → base = '' → görseller aynı origin'den gelir
 */
export const getImageUrl = (imagePath) => {
   if (!imagePath) return '';
   const apiUrl = import.meta.env.VITE_API_URL || '';
   // /api suffix'ini kaldır, sadece origin+port kalsın
   const base = apiUrl.replace(/\/api$/, '');
   return `${base}${imagePath}`;
};


// Request interceptor for adding auth token
api.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem('token');
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Response interceptor for handling errors
api.interceptors.response.use(
   (response) => response,
   (error) => {
      if (error.response?.status === 401) {
         // Handle unauthorized access
         localStorage.removeItem('token');
         window.location.href = '/login';
      }
      return Promise.reject(error);
   }
);

export default api;
