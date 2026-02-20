import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { X } from 'lucide-react';

const AdminProductForm = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const isEditMode = !!id;

   const [categories, setCategories] = useState([]);
   const [variations, setVariations] = useState([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   // Variation selection state
   const [selectedVariationId, setSelectedVariationId] = useState('');
   const [variationOptions, setVariationOptions] = useState([]); // [{name, enabled, stock}]

   const [formData, setFormData] = useState({
      name: '',
      description: '',
      basePrice: '',
      vatRate: 20,
      category: '',
      sku: '',
      sizes: [],
      lengths: [],
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

   const fetchProduct = async () => {
      try {
         setLoading(true);
         const response = await api.get(`/products/${id}`);
         const product = response.data.data;

         setFormData({
            name: product.name,
            description: product.description,
            basePrice: product.basePrice,
            vatRate: product.vatRate || 20,
            category: product.category._id,
            sizes: product.sizes || [],
            lengths: product.lengths.length > 0 ? product.lengths : [{ name: '125cm', priceAdjustment: 0 }],
            options: product.options || [],
            tags: product.tags || [],
            isFeatured: product.isFeatured,
            isNew: product.isNew
         });

         setExistingImages(product.images || []);

         // Try to auto-detect matching variation from existing sizes
         // We'll do this after variations are loaded
         if (product.sizes && product.sizes.length > 0) {
            setTimeout(() => {
               autoMatchVariation(product.sizes);
            }, 500);
         }
      } catch (error) {
         setError('Ürün yüklenirken hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   // Try to match existing product sizes to a variation
   const autoMatchVariation = (productSizes) => {
      const sizeNames = productSizes.map(s => s.name);
      // Find a variation whose options contain all the product size names
      const matchedVar = variations.find(v =>
         sizeNames.every(sn => v.options.includes(sn))
      );

      if (matchedVar) {
         setSelectedVariationId(matchedVar._id);
         setVariationOptions(
            matchedVar.options.map(opt => {
               const existingSize = productSizes.find(s => s.name === opt);
               return {
                  name: opt,
                  enabled: !!existingSize,
                  stock: existingSize ? existingSize.stock : 0
               };
            })
         );
      }
   };

   // When variation selection changes from dropdown
   const handleVariationChange = (variationId) => {
      setSelectedVariationId(variationId);

      if (!variationId) {
         setVariationOptions([]);
         return;
      }

      const variation = variations.find(v => v._id === variationId);
      if (variation) {
         // Check if we have existing sizes that match some options
         const existingSizes = formData.sizes || [];
         setVariationOptions(
            variation.options.map(opt => {
               const existing = existingSizes.find(s => s.name === opt);
               return {
                  name: opt,
                  enabled: existing ? true : false,
                  stock: existing ? existing.stock : 0
               };
            })
         );
      }
   };

   const toggleVariationOption = (index) => {
      const newOptions = [...variationOptions];
      newOptions[index].enabled = !newOptions[index].enabled;
      if (!newOptions[index].enabled) {
         newOptions[index].stock = 0;
      }
      setVariationOptions(newOptions);
   };

   const updateVariationStock = (index, value) => {
      const newOptions = [...variationOptions];
      newOptions[index].stock = parseInt(value) || 0;
      setVariationOptions(newOptions);
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setLoading(true);

      try {
         let productId = id;

         // Build sizes from variation options
         const sizesFromVariation = variationOptions
            .filter(opt => opt.enabled)
            .map(opt => ({ name: opt.name, stock: parseInt(opt.stock) || 0 }));

         // Prepare data with proper types
         const productData = {
            ...formData,
            basePrice: parseFloat(formData.basePrice) || 0,
            vatRate: parseFloat(formData.vatRate) || 20,
            sizes: sizesFromVariation.length > 0 ? sizesFromVariation : formData.sizes.map(s => ({
               name: s.name,
               stock: parseInt(s.stock) || 0
            })),
            lengths: formData.lengths.map(l => ({
               name: l.name,
               priceAdjustment: parseFloat(l.priceAdjustment) || 0
            })),
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

   // Length management
   const addLength = () => {
      setFormData({
         ...formData,
         lengths: [...formData.lengths, { name: '', priceAdjustment: 0 }]
      });
   };

   const updateLength = (index, field, value) => {
      const newLengths = [...formData.lengths];
      if (field === 'priceAdjustment') {
         newLengths[index][field] = value === '' ? 0 : parseFloat(value) || 0;
      } else {
         newLengths[index][field] = value;
      }
      setFormData({ ...formData, lengths: newLengths });
   };

   const removeLength = (index) => {
      setFormData({
         ...formData,
         lengths: formData.lengths.filter((_, i) => i !== index)
      });
   };

   // Option management
   const addOption = () => {
      setFormData({
         ...formData,
         options: [...formData.options, { name: '', price: 0, description: '' }]
      });
   };

   const updateOption = (index, field, value) => {
      const newOptions = [...formData.options];
      newOptions[index][field] = field === 'price' ? parseFloat(value) || 0 : value;
      setFormData({ ...formData, options: newOptions });
   };

   const removeOption = (index) => {
      setFormData({
         ...formData,
         options: formData.options.filter((_, i) => i !== index)
      });
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
                        placeholder="20"
                     />
                     <small className="text-muted">Varsayılan: %20 KDV</small>
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
                           <img src={`http://localhost:5000${img}`} alt={`Product ${index + 1}`} />
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

            {/* Variation & Stock Selection — Shopier style */}
            <div className="card">
               <h3>Varyasyon & Stok Seçimi</h3>
               <p className="text-muted" style={{ marginBottom: '1rem' }}>
                  Bu üründe sunmak istediğiniz varyasyonu seçtikten sonra her seçenek için stok bilgisi girebilirsiniz.
               </p>

               <div className="form-group">
                  <label>Varyasyon Seçin</label>
                  <select
                     className="form-select"
                     value={selectedVariationId}
                     onChange={(e) => handleVariationChange(e.target.value)}
                  >
                     <option value="">Varyasyon Seçin (opsiyonel)</option>
                     {variations.map(v => (
                        <option key={v._id} value={v._id}>{v.name}</option>
                     ))}
                  </select>
                  {variations.length === 0 && (
                     <small className="text-muted">
                        Henüz varyasyon tanımlanmamış.{' '}
                        <a href="/admin/variations" style={{ color: 'var(--color-primary)' }}>Varyasyon tanımla →</a>
                     </small>
                  )}
               </div>

               {variationOptions.length > 0 && (
                  <div className="variation-stock-section">
                     <table className="variation-stock-table">
                        <thead>
                           <tr>
                              <th style={{ width: '50px' }}>Aktif</th>
                              <th>Varyasyon</th>
                              <th style={{ width: '150px' }}>Stok</th>
                           </tr>
                        </thead>
                        <tbody>
                           {variationOptions.map((opt, index) => (
                              <tr key={index} style={{ opacity: opt.enabled ? 1 : 0.5 }}>
                                 <td>
                                    <input
                                       type="checkbox"
                                       className="variation-stock-checkbox"
                                       checked={opt.enabled}
                                       onChange={() => toggleVariationOption(index)}
                                    />
                                 </td>
                                 <td>
                                    <span className="variation-option-name">{opt.name}</span>
                                 </td>
                                 <td>
                                    <input
                                       type="number"
                                       className="form-input"
                                       value={opt.stock === 0 ? '' : opt.stock}
                                       onChange={(e) => updateVariationStock(index, e.target.value)}
                                       min="0"
                                       placeholder="0"
                                       disabled={!opt.enabled}
                                    />
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>

            {/* Lengths */}
            <div className="card">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Boy Seçenekleri</h3>
                  <button type="button" onClick={addLength} className="btn btn-secondary btn-sm">
                     + Boy Ekle
                  </button>
               </div>

               <div className="variant-items-grid">
                  {formData.lengths.map((length, index) => (
                     <div key={index} className="variant-item-compact">
                        <button
                           type="button"
                           onClick={() => removeLength(index)}
                           className="variant-item-remove"
                           disabled={formData.lengths.length === 1}
                           title="Sil"
                        >
                           <X size={14} />
                        </button>
                        <div className="form-group">
                           <label>Boy (cm)</label>
                           <input
                              type="text"
                              className="form-input"
                              value={length.name}
                              onChange={(e) => updateLength(index, 'name', e.target.value)}
                              placeholder="Örn: 125, 130"
                              required
                           />
                        </div>
                        <div className="form-group">
                           <label>Fiyat Farkı (₺)</label>
                           <input
                              type="number"
                              className="form-input"
                              value={length.priceAdjustment === 0 ? '' : length.priceAdjustment}
                              onChange={(e) => updateLength(index, 'priceAdjustment', e.target.value)}
                              placeholder="Opsiyonel"
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Options (Shopier style) */}
            <div className="card">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Ek Opsiyonlar (Şal, Etek vb.)</h3>
                  <button type="button" onClick={addOption} className="btn btn-secondary btn-sm">
                     + Opsiyon Ekle
                  </button>
               </div>

               {formData.options.length === 0 ? (
                  <p className="text-muted">Henüz opsiyon eklenmemiş. Şal, etek gibi ek ürünler ekleyebilirsiniz.</p>
               ) : (
                  <div className="variant-items-grid">
                     {formData.options.map((option, index) => (
                        <div key={index} className="variant-item-compact">
                           <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="variant-item-remove"
                              title="Sil"
                           >
                              <X size={14} />
                           </button>
                           <div className="form-group">
                              <label>Opsiyon Adı</label>
                              <input
                                 type="text"
                                 className="form-input"
                                 value={option.name}
                                 onChange={(e) => updateOption(index, 'name', e.target.value)}
                                 placeholder="Örn: Şal, Etek"
                                 required
                              />
                           </div>
                           <div className="form-group">
                              <label>Fiyat (₺)</label>
                              <input
                                 type="number"
                                 className="form-input"
                                 value={option.price === 0 ? '' : option.price}
                                 onChange={(e) => updateOption(index, 'price', e.target.value)}
                                 min="0"
                                 placeholder="Opsiyonel"
                              />
                           </div>
                        </div>
                     ))}
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