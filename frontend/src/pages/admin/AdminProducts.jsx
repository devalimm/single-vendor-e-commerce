import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Edit, Trash2, Search } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const AdminProducts = () => {
   const [products, setProducts] = useState([]);
   const [filteredProducts, setFilteredProducts] = useState([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null, productName: '' });

   useEffect(() => {
      fetchProducts();
   }, []);

   const fetchProducts = async () => {
      try {
         setLoading(true);
         const response = await api.get('/products');
         setProducts(response.data.data);
      } catch (error) {
         console.error('Error fetching products:', error);
         setError('Ürünler yüklenirken hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   // Filter products based on search
   useEffect(() => {
      if (searchQuery.trim() === '') {
         setFilteredProducts(products);
      } else {
         const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
         );
         setFilteredProducts(filtered);
      }
   }, [searchQuery, products]);

   const handleDeleteClick = (product) => {
      setDeleteModal({
         isOpen: true,
         productId: product._id,
         productName: product.name
      });
   };

   const handleDeleteConfirm = async () => {
      try {
         await api.delete(`/products/${deleteModal.productId}`);
         setProducts(products.filter(p => p._id !== deleteModal.productId));
      } catch (error) {
         alert('Ürün silinirken hata oluştu: ' + (error.response?.data?.message || error.message));
      }
   };

   const toggleActive = async (product) => {
      try {
         await api.put(`/products/${product._id}`, {
            isActive: !product.isActive
         });
         fetchProducts();
      } catch (error) {
         alert('Durum güncellenirken hata oluştu.');
      }
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
            <h1>Ürünler</h1>
            <Link to="/admin/products/new" className="btn btn-primary">
               + Yeni Ürün Ekle
            </Link>
         </div>

         {error && <div className="alert alert-error">{error}</div>}

         {/* Search Bar */}
         {products.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
               <div className="search-bar">
                  <Search size={20} className="search-icon" />
                  <input
                     type="text"
                     placeholder="Ürün ara (İsim, Kategori, Stok Kodu)..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="search-input"
                  />
                  {searchQuery && (
                     <button
                        onClick={() => setSearchQuery('')}
                        className="search-clear"
                        aria-label="Temizle"
                     >
                        ×
                     </button>
                  )}
               </div>
               {searchQuery && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                     {filteredProducts.length} ürün bulundu
                  </p>
               )}
            </div>
         )}

         <div className="admin-table-container">
            {products.length === 0 ? (
               <div className="empty-state">
                  <p>Henüz ürün eklenmemiş.</p>
                  <Link to="/admin/products/new" className="btn btn-primary">
                     İlk Ürünü Ekle
                  </Link>
               </div>
            ) : filteredProducts.length === 0 ? (
               <div className="empty-state">
                  <p>Arama kriterlerinize uygun ürün bulunamadı.</p>
                  <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
                     Aramayı Temizle
                  </button>
               </div>
            ) : (
               <table className="admin-table">
                  <thead>
                     <tr>
                        <th>Resim</th>
                        <th>Ürün Adı</th>
                        <th>Stok Kodu</th>
                        <th>Kategori</th>
                        <th>Fiyat</th>
                        <th>Stok</th>
                        <th>Satış</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredProducts.map((product) => (
                        <tr key={product._id}>
                           <td>
                              <img
                                 src={product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/60'}
                                 alt={product.name}
                                 style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                           </td>
                           <td><strong>{product.name}</strong></td>
                           <td>
                              {product.sku ? (
                                 <code style={{
                                    background: 'var(--color-background)',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace'
                                 }}>
                                    {product.sku}
                                 </code>
                              ) : (
                                 <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                              )}
                           </td>
                           <td>{product.category?.name || '-'}</td>
                           <td><strong>{product.basePrice.toFixed(2)} ₺</strong></td>
                           <td>
                              <span className={product.totalStock > 0 ? 'badge badge-success' : 'badge badge-inactive'}>
                                 {product.totalStock} adet
                              </span>
                           </td>
                           <td>{product.salesCount || 0}</td>
                           <td>
                              <button
                                 onClick={() => toggleActive(product)}
                                 className={`badge ${product.isActive ? 'badge-success' : 'badge-inactive'}`}
                                 style={{ cursor: 'pointer', border: 'none' }}
                              >
                                 {product.isActive ? 'Aktif' : 'Pasif'}
                              </button>
                           </td>
                           <td>
                              <div className="table-actions">
                                 <Link
                                    to={`/admin/products/edit/${product._id}`}
                                    className="btn-icon"
                                    title="Düzenle"
                                 >
                                    <Edit size={18} />
                                 </Link>
                                 <button
                                    onClick={() => handleDeleteClick(product)}
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
            onClose={() => setDeleteModal({ isOpen: false, productId: null, productName: '' })}
            onConfirm={handleDeleteConfirm}
            title="Ürünü Sil"
            message={`"${deleteModal.productName}" ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
            confirmText="Sil"
            cancelText="İptal"
            type="danger"
         />
      </div>
   );
};

export default AdminProducts;
