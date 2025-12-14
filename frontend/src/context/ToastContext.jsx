import { createContext, useContext, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
   const context = useContext(ToastContext);
   if (!context) {
      throw new Error('useToast must be used within ToastProvider');
   }
   return context;
};

export const ToastProvider = ({ children }) => {
   const [toasts, setToasts] = useState([]);

   const showToast = (message, type = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);

      // Auto remove after 3 seconds
      setTimeout(() => {
         setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 3000);
   };

   const removeToast = (id) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
   };

   return (
      <ToastContext.Provider value={{ showToast }}>
         {children}

         {/* Toast Container */}
         <div className="toast-container">
            {toasts.map(toast => (
               <div key={toast.id} className={`toast toast-${toast.type}`}>
                  <CheckCircle size={20} />
                  <span>{toast.message}</span>
                  <button
                     className="toast-close"
                     onClick={() => removeToast(toast.id)}
                     aria-label="Close"
                  >
                     <X size={16} />
                  </button>
               </div>
            ))}
         </div>
      </ToastContext.Provider>
   );
};
