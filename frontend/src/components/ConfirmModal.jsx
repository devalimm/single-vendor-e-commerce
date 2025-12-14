import { X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Evet', cancelText = 'İptal', type = 'danger' }) => {
   if (!isOpen) return null;

   return (
      <div className="modal-overlay" onClick={onClose}>
         <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={onClose} aria-label="Kapat">
               <X size={20} />
            </button>

            <div className="modal-header">
               <h3 className="modal-title">{title}</h3>
            </div>

            <div className="modal-body">
               <p>{message}</p>
            </div>

            <div className="modal-footer">
               <button
                  onClick={onClose}
                  className="btn btn-secondary"
               >
                  {cancelText}
               </button>
               <button
                  onClick={() => {
                     onConfirm();
                     onClose();
                  }}
                  className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
               >
                  {confirmText}
               </button>
            </div>
         </div>
      </div>
   );
};

export default ConfirmModal;
