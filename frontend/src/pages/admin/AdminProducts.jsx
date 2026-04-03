import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const AdminProducts = () => {
   const [products, setProducts] = useState([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [searchDebounce, setSearchDebounce] = useState('');
   const [sortOrder, setSortOrder] = useState('newest'); // default to newest first
   const [page, setPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalProducts, setTotalProducts] = useState(0);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null, productName: '' });

   // Debounce search
   useEffect(() => {
      const timer = setTimeout(() => {
         setSearchDebounce(searchQuery);
         setPage(1);
      }, 500);
      return () => clearTimeout(timer);
   }, [searchQuery]);

   useEffect(() => {
      fetchProducts();
   }, [page, searchDebounce, sortOrder]);

   const fetchProducts = async () => {
      try {
         setLoading(true);
         const response = await api.get('/products/admin/all', {
            params: {
               page,
               limit: 15,
               search: searchDebounce,
               sort: sortOrder
            }
         });
         setProducts(response.data.data);
         setTotalPages(response.data.pages);
         setTotalProducts(response.data.total);
      } catch (error) {
         console.error('Error fetching products:', error);
         setError('Ürünler yüklenirken hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

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
         // Re-fetch current page or update locally. Usually better to refetch to preserve pagination counts.
         fetchProducts();
         setDeleteModal({ isOpen: false, productId: null, productName: '' });
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

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
         setPage(newPage);
      }
   };

   return (
      <div className="admin-page">
         <div className="admin-header">
            <h1>Ürünler</h1>
            <Link to="/admin/products/new" className="btn btn-primary">
               + Yeni Ürün Ekle
            </Link>
         </div>

         {error && <div className="alert alert-error">{error}</div>}

         {/* Filtering and Sort Header */}
         <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 300px' }}>
               <div className="search-bar" style={{ margin: 0 }}>
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
               {searchDebounce && !loading && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                     {totalProducts} ürün bulundu
                  </p>
               )}
            </div>

            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <ArrowUpDown size={18} style={{ color: 'var(--color-text-secondary)' }}/>
               <select 
                  value={sortOrder} 
                  onChange={(e) => {
                     setSortOrder(e.target.value);
                     setPage(1);
                  }}
                  className="form-input" 
                  style={{ width: 'auto', minWidth: '180px', margin: 0, padding: '0.5rem' }}
               >
                  <option value="newest">Yeniden Eskiye (Son Eklenenler)</option>
                  <option value="oldest">Eskiden Yeniye</option>
                  <option value="price-desc">Fiyata Göre Azalan</option>
                  <option value="price-asc">Fiyata Göre Artan</option>
               </select>
            </div>
         </div>

         <div className="admin-table-container">
            {loading && products.length === 0 ? (
               <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                  <div className="spinner"></div>
               </div>
            ) : products.length === 0 ? (
               <div className="empty-state">
                  <p>{searchDebounce ? 'Arama kriterlerinize uygun ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}</p>
                  {!searchDebounce && (
                     <Link to="/admin/products/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        İlk Ürünü Ekle
                     </Link>
                  )}
               </div>
            ) : (
               <>
                  <table className="admin-table">
                     <thead>
                        <tr>
                           <th>Resim</th>
                           <th>Ürün Adı</th>
                           <th>Stok Kodu</th>
                           <th>Kategori</th>
                           <th>Fiyat</th>
                           <th>Satış</th>
                           <th>Durum</th>
                           <th>İşlemler</th>
                        </tr>
                     </thead>
                     <tbody>
                        {products.map((product) => (
                           <tr key={product._id} style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                              <td>
                                 <img
                                    src={product.images?.[0] ? getImageUrl(product.images[0]) : 'https://placehold.net/default.png'}
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

                  {/* Pagination Control */}
                  {totalPages > 1 && (
                     <div className="pagination" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem',
                        marginTop: '2rem',
                        padding: '1rem',
                        borderTop: '1px solid var(--color-border)'
                     }}>
                        <button
                           onClick={() => handlePageChange(page - 1)}
                           disabled={page === 1 || loading}
                           className="btn btn-secondary"
                           style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                        >
                           <ChevronLeft size={20} />
                        </button>

                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                           Sayfa {page} / {totalPages}
                        </span>

                        <button
                           onClick={() => handlePageChange(page + 1)}
                           disabled={page === totalPages || loading}
                           className="btn btn-secondary"
                           style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                        >
                           <ChevronRight size={20} />
                        </button>
                     </div>
                  )}
               </>
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
