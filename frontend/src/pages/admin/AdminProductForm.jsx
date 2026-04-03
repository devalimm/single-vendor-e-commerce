import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';

const AdminProductForm = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const isEditMode = !!id;

   const [categories, setCategories] = useState([]);
   const [variations, setVariations] = useState([]);
   const [availableOptions, setAvailableOptions] = useState([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   // Selected variation IDs for this product
   const [selectedVariationIds, setSelectedVariationIds] = useState([]);

   const [formData, setFormData] = useState({
      name: '',
      description: '',
      basePrice: '',
      vatRate: 10,
      category: '',
      sku: '',
      options: [],
      tags: [],
      isFeatured: false,
      isNew: false
   });

   const [images, setImages] = useState([]);
   const [existingImages, setExistingImages] = useState([]);

   useEffect(() => {
      fetchCategories();
      fetchVariations();
      fetchAvailableOptions();
      if (isEditMode) {
         fetchProduct();
      }
   }, [id]);

   const fetchCategories = async () => {
      try {
         const response = await api.get('/categories');
         setCategories(response.data.data);
      } catch (error) {
         console.error('Error fetching categories:', error);
      }
   };

   const fetchVariations = async () => {
      try {
         const response = await api.get('/variations');
         setVariations(response.data.data.filter(v => v.isActive));
      } catch (error) {
         console.error('Error fetching variations:', error);
      }
   };

   const fetchAvailableOptions = async () => {
      try {
         const response = await api.get('/options');
         setAvailableOptions(response.data.data.filter(o => o.isActive));
      } catch (error) {
         console.error('Error fetching options:', error);
      }
   };

   // Pending variation names to resolve once variations load
   const [pendingVarNames, setPendingVarNames] = useState([]);

   // Resolve pending variation names to IDs when variations load
   useEffect(() => {
      if (pendingVarNames.length > 0 && variations.length > 0) {
         const ids = [];
         pendingVarNames.forEach(varName => {
            const found = variations.find(v => v.name === varName);
            if (found) ids.push(found._id);
         });
         setSelectedVariationIds(ids);
         setPendingVarNames([]);
      }
   }, [variations, pendingVarNames]);

   const fetchProduct = async () => {
      try {
         setLoading(true);
         const response = await api.get(`/products/${id}`);
         const product = response.data.data;

         setFormData({
            name: product.name,
            description: product.description,
            basePrice: product.basePrice,
            vatRate: product.vatRate || 10,
            category: product.category._id,
            options: product.options || [],
            tags: product.tags || [],
            isFeatured: product.isFeatured,
            isNew: product.isNew
         });

         setExistingImages(product.images || []);

         // Store pending variation names to be resolved when variations load
         if (product.selectedVariations && product.selectedVariations.length > 0) {
            setPendingVarNames(product.selectedVariations);
         }
      } catch (error) {
         setError('Ürün yüklenirken hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   const toggleVariation = (varId) => {
      setSelectedVariationIds(prev => {
         if (prev.includes(varId)) {
            return prev.filter(id => id !== varId);
         }
         return [...prev, varId];
      });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setLoading(true);

      try {
         let productId = id;

         // Build selectedVariations names
         const selectedVariationNames = selectedVariationIds
            .map(vid => variations.find(v => v._id === vid)?.name)
            .filter(Boolean);

         // Prepare data
         const productData = {
            ...formData,
            basePrice: parseFloat(formData.basePrice) || 0,
            vatRate: parseFloat(formData.vatRate) || 10,
            selectedVariations: selectedVariationNames,
            sizes: [], // No longer using sizes for combinations
            lengths: [],
            options: formData.options.map(o => ({
               name: o.name,
               price: parseFloat(o.price) || 0,
               description: o.description || ''
            }))
         };

         // Create or update product
         if (isEditMode) {
            await api.put(`/products/${id}`, productData);
            setSuccess('Ürün güncellendi!');
         } else {
            const response = await api.post('/products', productData);
            productId = response.data.data._id;
            setSuccess('Ürün oluşturuldu!');
         }

         // Upload images if any
         if (images.length > 0) {
            const imageFormData = new FormData();
            images.forEach(image => {
               imageFormData.append('images', image);
            });

            await api.post(`/products/${productId}/images`, imageFormData, {
               headers: { 'Content-Type': 'multipart/form-data' }
            });
         }

         setTimeout(() => navigate('/admin/products'), 1500);
      } catch (error) {
         console.error('Product save error:', error.response?.data);
         const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Bir hata oluştu.';
         setError(errorMsg);
      } finally {
         setLoading(false);
      }
   };

   const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files]);
   };

   const removeImage = (index) => {
      setImages(prev => prev.filter((_, i) => i !== index));
   };

   const removeExistingImage = async (imagePath) => {
      if (!confirm('Bu resmi silmek istediğinizden emin misiniz?')) return;

      try {
         await api.delete(`/products/${id}/images/${encodeURIComponent(imagePath)}`);
         setExistingImages(prev => prev.filter(img => img !== imagePath));
      } catch (error) {
         alert('Resim silinirken hata oluştu.');
      }
   };

   // Option management (global options)
   const toggleGlobalOption = (opt) => {
      const exists = formData.options.find(o => o.name === opt.name);
      if (exists) {
         setFormData({
            ...formData,
            options: formData.options.filter(o => o.name !== opt.name)
         });
      } else {
         setFormData({
            ...formData,
            options: [...formData.options, { name: opt.name, price: opt.price }]
         });
      }
   };

   if (loading && isEditMode) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   return (
      <div className="admin-page">
         <div className="admin-header">
            <h1>{isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h1>
            <button onClick={() => navigate('/admin/products')} className="btn btn-secondary">
               ← Geri
            </button>
         </div>

         {error && <div className="alert alert-error">{error}</div>}
         {success && <div className="alert alert-success">{success}</div>}

         <form onSubmit={handleSubmit} className="product-form">
            {/* Basic Info */}
            <div className="card">
               <h3>Temel Bilgiler</h3>

               <div className="form-group">
                  <label>Ürün Adı *</label>
                  <input
                     type="text"
                     className="form-input"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     required
                     placeholder="Örn: Şık Abiye Elbise"
                  />
               </div>

               <div className="form-group">
                  <label>Açıklama</label>
                  <textarea
                     className="form-textarea"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     placeholder="Ürün açıklaması (opsiyonel)..."
                     rows={5}
                  />
               </div>

               <div className="form-row">
                  <div className="form-group">
                     <label>Kategori *</label>
                     <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                     >
                        <option value="">Kategori Seçin</option>
                        {categories.map(cat => (
                           <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                     </select>
                  </div>

                  <div className="form-group">
                     <label>Temel Fiyat (₺) *</label>
                     <input
                        type="number"
                        className="form-input"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        required
                        min="0"
                        placeholder="0"
                     />
                  </div>

                  <div className="form-group">
                     <label>KDV Oranı (%)</label>
                     <input
                        type="number"
                        className="form-input"
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                        min="0"
                        max="100"
                        placeholder="10"
                     />
                     <small className="text-muted">Varsayılan: %10 KDV</small>
                  </div>

                  <div className="form-group">
                     <label>Stok Kodu</label>
                     <input
                        type="text"
                        className="form-input"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                     />
                     <small className="text-muted">Opsiyonel - Ürün takibi için kullanılır</small>
                  </div>
               </div>

               <div className="form-row">
                  <div className="form-group">
                     <label>
                        <input
                           type="checkbox"
                           checked={formData.isFeatured}
                           onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        />
                        {' '}Öne Çıkan Ürün
                     </label>
                  </div>

                  <div className="form-group">
                     <label>
                        <input
                           type="checkbox"
                           checked={formData.isNew}
                           onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                        />
                        {' '}Yeni Ürün
                     </label>
                  </div>
               </div>
            </div>

            {/* Images */}
            <div className="card">
               <h3>Ürün Resimleri</h3>

               {existingImages.length > 0 && (
                  <div className="image-grid">
                     {existingImages.map((img, index) => (
                        <div key={index} className="image-preview">
                           <img src={getImageUrl(img)} alt={`Product ${index + 1}`} />
                           <button
                              type="button"
                              onClick={() => removeExistingImage(img)}
                              className="image-remove-btn"
                           >
                              ✕
                           </button>
                        </div>
                     ))}
                  </div>
               )}

               {images.length > 0 && (
                  <div className="image-grid">
                     {images.map((img, index) => (
                        <div key={index} className="image-preview">
                           <img src={URL.createObjectURL(img)} alt={`New ${index + 1}`} />
                           <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="image-remove-btn"
                           >
                              ✕
                           </button>
                        </div>
                     ))}
                  </div>
               )}

               <div className="form-group">
                  <label>Resim Ekle</label>
                  <input
                     type="file"
                     accept="image/*"
                     multiple
                     onChange={handleImageChange}
                     className="form-input"
                  />
                  <small className="text-muted">Birden fazla resim seçebilirsiniz (max 5MB/resim)</small>
               </div>
            </div>

            {/* Variation Selection — simplified, no matrix */}
            <div className="card">
               <h3>Varyasyonlar</h3>
               <p className="text-muted" style={{ marginBottom: '1rem' }}>
                  Bu ürüne hangi varyasyonların uygulanacağını seçin. Müşteri ürün detayında her varyasyonu ayrı ayrı seçecek.
                  <br />
                  <small>Ekstra fiyatlar <a href="/admin/variations" style={{ color: 'var(--color-primary)' }}>Varyasyon Tanımlama</a> sayfasından yönetilir.</small>
               </p>

               {variations.length === 0 ? (
                  <p className="text-muted">
                     Henüz varyasyon tanımlanmamış.{' '}
                     <a href="/admin/variations" style={{ color: 'var(--color-primary)' }}>Varyasyon tanımla →</a>
                  </p>
               ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     {variations.map(v => {
                        const isSelected = selectedVariationIds.includes(v._id);
                        return (
                           <label
                              key={v._id}
                              style={{
                                 display: 'flex',
                                 alignItems: 'flex-start',
                                 gap: '0.75rem',
                                 padding: '1rem',
                                 // background: isSelected ? 'var(--color-primary-light, rgba(233, 30, 99, 0.05))' : 'var(--color-bg-secondary)',
                                 borderRadius: 'var(--radius-sm)',
                                 border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s ease'
                              }}
                           >
                              <input
                                 type="checkbox"
                                 checked={isSelected}
                                 onChange={() => toggleVariation(v._id)}
                                 style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
                              />
                              <div>
                                 <strong>{v.name}</strong>
                                 <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                    {v.options.map((opt, i) => (
                                       <span key={i}>
                                          {opt.name}
                                          {opt.extraPrice > 0 && <span style={{ color: 'var(--color-primary)' }}> (+{opt.extraPrice}₺)</span>}
                                          {i < v.options.length - 1 && ', '}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           </label>
                        );
                     })}
                  </div>
               )}
            </div>

            {/* Global Options */}
            <div className="card">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Ekstra Opsiyonlar (Kutu, Özel Dikiş vb.)</h3>
               </div>

               {availableOptions.length === 0 ? (
                  <p className="text-muted">
                     Henüz opsiyon tanımlanmamış.{' '}
                     <a href="/admin/options" style={{ color: 'var(--color-primary)' }}>Opsiyon tanımla →</a>
                  </p>
               ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     {availableOptions.map(opt => {
                        const isChecked = formData.options.some(o => o.name === opt.name);
                        return (
                           <label key={opt._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                              <input
                                 type="checkbox"
                                 checked={isChecked}
                                 onChange={() => toggleGlobalOption(opt)}
                                 style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <strong style={{ fontWeight: 'var(--font-weight-medium)' }}>{opt.name}</strong>
                                 <span style={{ fontSize: '0.875rem', color: opt.price > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                    {opt.price > 0 ? `+${opt.price} ₺` : 'Ücretsiz'}
                                 </span>
                              </div>
                           </label>
                        );
                     })}
                  </div>
               )}
            </div>

            {/* Submit */}
            <div className="form-actions">
               <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Ürünü Ekle')}
               </button>
               <button type="button" onClick={() => navigate('/admin/products')} className="btn btn-secondary">
                  İptal
               </button>
            </div>
         </form>
      </div>
   );
};

export default AdminProductForm;