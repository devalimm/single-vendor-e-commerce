import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Edit, Trash2, Plus } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const AdminCategories = () => {
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(true);
   const [showForm, setShowForm] = useState(false);
   const [editingCategory, setEditingCategory] = useState(null);
   const [formData, setFormData] = useState({
      name: '',
      description: ''
   });
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null, categoryName: '' });

   useEffect(() => {
      fetchCategories();
   }, []);

   const fetchCategories = async () => {
      try {
         setLoading(true);
         const response = await api.get('/categories');
         setCategories(response.data.data);
      } catch (error) {
         console.error('Error fetching categories:', error);
         setError('Kategoriler yüklenirken hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      try {
         if (editingCategory) {
            await api.put(`/categories/${editingCategory._id}`, formData);
            setSuccess('Kategori güncellendi!');
         } else {
            await api.post('/categories', formData);
            setSuccess('Kategori eklendi!');
         }

         setFormData({ name: '', description: '' });
         setShowForm(false);
         setEditingCategory(null);
         fetchCategories();
      } catch (error) {
         setError(error.response?.data?.message || 'Bir hata oluştu.');
      }
   };

   const handleEdit = (category) => {
      setEditingCategory(category);
      setFormData({
         name: category.name,
         description: category.description || ''
      });
      setShowForm(true);
   };

   const handleDeleteClick = (category) => {
      setDeleteModal({
         isOpen: true,
         categoryId: category._id,
         categoryName: category.name
      });
   };

   const handleDeleteConfirm = async () => {
      try {
         await api.delete(`/categories/${deleteModal.categoryId}`);
         setSuccess('Kategori silindi!');
         fetchCategories();
      } catch (error) {
         setError(error.response?.data?.message || 'Silme işlemi başarısız.');
      }
   };

   const handleCancel = () => {
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      setError('');
   };

   if (loading) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   return (
      <div className="admin-page">
         <div className="admin-header">
            <h1>Kategoriler</h1>
            <button
               onClick={() => setShowForm(!showForm)}
               className="btn btn-primary"
            >
               {showForm ? 'İptal' : '+ Yeni Kategori'}
            </button>
         </div>

         {error && <div className="alert alert-error">{error}</div>}
         {success && <div className="alert alert-success">{success}</div>}

         {showForm && (
            <div className="card" style={{ marginBottom: '2rem' }}>
               <h3>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}</h3>
               <form onSubmit={handleSubmit}>
                  <div className="form-group">
                     <label>Kategori Adı *</label>
                     <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Örn: Elbiseler"
                     />
                  </div>

                  <div className="form-group">
                     <label>Açıklama</label>
                     <textarea
                        className="form-textarea"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Kategori açıklaması (opsiyonel)"
                     />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                     <button type="submit" className="btn btn-primary">
                        {editingCategory ? 'Güncelle' : 'Ekle'}
                     </button>
                     <button type="button" onClick={handleCancel} className="btn btn-secondary">
                        İptal
                     </button>
                  </div>
               </form>
            </div>
         )}

         <div className="admin-table-container">
            {categories.length === 0 ? (
               <div className="empty-state">
                  <p>Henüz kategori eklenmemiş.</p>
                  <button onClick={() => setShowForm(true)} className="btn btn-primary">
                     İlk Kategoriyi Ekle
                  </button>
               </div>
            ) : (
               <table className="admin-table">
                  <thead>
                     <tr>
                        <th>Kategori Adı</th>
                        <th>Açıklama</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                     </tr>
                  </thead>
                  <tbody>
                     {categories.map((category) => (
                        <tr key={category._id}>
                           <td><strong>{category.name}</strong></td>
                           <td>{category.description || '-'}</td>
                           <td>
                              <span className={`badge ${category.isActive ? 'badge-success' : 'badge-inactive'}`}>
                                 {category.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                           </td>
                           <td>
                              <div className="table-actions">
                                 <button
                                    onClick={() => handleEdit(category)}
                                    className="btn-icon"
                                    title="Düzenle"
                                 >
                                    <Edit size={18} />
                                 </button>
                                 <button
                                    onClick={() => handleDeleteClick(category)}
                                    className="btn-icon btn-danger"
                                    title="Sil"
                                 >
                                    <Trash2 size={18} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>

         <ConfirmModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' })}
            onConfirm={handleDeleteConfirm}
            title="Kategoriyi Sil"
            message={`"${deleteModal.categoryName}" kategorisini silmek istediğinizden emin misiniz? Bu kategoriye bağlı ürünler etkilenebilir.`}
            confirmText="Sil"
            cancelText="İptal"
            type="danger"
         />
      </div>
   );
};

export default AdminCategories;
