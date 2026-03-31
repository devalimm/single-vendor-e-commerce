import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { X } from 'lucide-react';

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

   // Variation selection state — supports up to 2 variations
   const [selectedVariationId1, setSelectedVariationId1] = useState('');
   const [selectedVariationId2, setSelectedVariationId2] = useState('');
   const [variationOptions, setVariationOptions] = useState([]); // [{name, enabled, stock}]
   const [groupBy, setGroupBy] = useState('var2'); // 'var1' or 'var2'
   const [expandedGroups, setExpandedGroups] = useState(new Set());

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

         // Auto-restore variation selections from saved product
         if (product.selectedVariations && product.selectedVariations.length > 0) {
            setTimeout(() => {
               autoRestoreVariations(product.selectedVariations, product.sizes || []);
            }, 500);
         }
      } catch (error) {
         setError('Ürün yüklenirken hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   // Restore variation dropdowns and stock from saved product
   const autoRestoreVariations = (savedVarNames, productSizes) => {
      const var1 = variations.find(v => v.name === savedVarNames[0]);
      const var2 = savedVarNames.length > 1 ? variations.find(v => v.name === savedVarNames[1]) : null;

      if (var1) setSelectedVariationId1(var1._id);
      if (var2) setSelectedVariationId2(var2._id);

      // Build combination matrix with existing stock
      const combos = buildCombinationMatrix(
         var1 ? var1.options : [],
         var2 ? var2.options : [],
         productSizes
      );
      setVariationOptions(combos);
   };

   // Generate combination matrix from 1 or 2 variation option arrays
   const buildCombinationMatrix = (opts1, opts2, existingSizes = []) => {
      const combos = [];

      if (opts2.length === 0) {
         // Single variation
         for (const option1 of opts1) {
            const o1Name = typeof option1 === 'string' ? option1 : option1.name;
            const o1Price = typeof option1 === 'object' && option1.extraPrice ? option1.extraPrice : 0;
            
            const existing = existingSizes.find(s => s.name === o1Name);
            combos.push({
               name: o1Name,
               enabled: !!existing,
               stock: 9999, // unlimited stock
               price: existing && existing.extraPrice !== undefined ? existing.extraPrice : o1Price
            });
         }
      } else {
         // Dual variation — cartesian product
         for (const option1 of opts1) {
            for (const option2 of opts2) {
               const o1Name = typeof option1 === 'string' ? option1 : option1.name;
               const o2Name = typeof option2 === 'string' ? option2 : option2.name;
               const o1Price = typeof option1 === 'object' && option1.extraPrice ? option1.extraPrice : 0;
               const o2Price = typeof option2 === 'object' && option2.extraPrice ? option2.extraPrice : 0;
               
               const comboName = `${o1Name} | ${o2Name}`;
               const defaultComboPrice = o1Price + o2Price;
               
               const existing = existingSizes.find(s => s.name === comboName);
               combos.push({
                  name: comboName,
                  enabled: !!existing,
                  stock: 9999,
                  price: existing && existing.extraPrice !== undefined ? existing.extraPrice : defaultComboPrice
               });
            }
         }
      }

      return combos;
   };

   // Rebuild matrix whenever a variation dropdown changes
   const rebuildMatrix = (varId1, varId2) => {
      const var1 = variations.find(v => v._id === varId1);
      const var2 = varId2 ? variations.find(v => v._id === varId2) : null;

      if (!var1) {
         setVariationOptions([]);
         return;
      }

      const combos = buildCombinationMatrix(
         var1.options,
         var2 ? var2.options : [],
         formData.sizes || []
      );
      setVariationOptions(combos);
   };

   const handleVariation1Change = (variationId) => {
      setSelectedVariationId1(variationId);
      // If clearing var1, also clear var2
      if (!variationId) {
         setSelectedVariationId2('');
         setVariationOptions([]);
         return;
      }
      rebuildMatrix(variationId, selectedVariationId2);
   };

   const handleVariation2Change = (variationId) => {
      setSelectedVariationId2(variationId);
      rebuildMatrix(selectedVariationId1, variationId);
   };

   const toggleVariationOption = (index) => {
      const newOptions = [...variationOptions];
      newOptions[index].enabled = !newOptions[index].enabled;
      setVariationOptions(newOptions);
   };

   const updateVariationPrice = (index, value) => {
      const newOptions = [...variationOptions];
      newOptions[index].price = parseFloat(value) || 0;
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
            .map(opt => ({ 
               name: opt.name, 
               stock: 9999,
               extraPrice: parseFloat(opt.price) || 0
            }));

         // Build selectedVariations names
         const selectedVariationNames = [];
         const var1 = variations.find(v => v._id === selectedVariationId1);
         const var2 = variations.find(v => v._id === selectedVariationId2);
         if (var1) selectedVariationNames.push(var1.name);
         if (var2) selectedVariationNames.push(var2.name);

         // Prepare data with proper types
         const productData = {
            ...formData,
            basePrice: parseFloat(formData.basePrice) || 0,
            vatRate: parseFloat(formData.vatRate) || 20,
            selectedVariations: selectedVariationNames,
            sizes: sizesFromVariation.length > 0 ? sizesFromVariation : formData.sizes.map(s => ({
               name: s.name,
               stock: 9999,
               extraPrice: parseFloat(s.extraPrice) || 0
            })),
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



   // Option management
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

            {/* Variation & Stock Selection — Shopier style */}
            <div className="card">
               <h3>Varyasyon & Stok Seçimi</h3>
               <p className="text-muted" style={{ marginBottom: '1rem' }}>
                  Bu üründe en fazla 2 varyasyon seçebilirsiniz. Örneğin: Beden + Renk.
                  Her kombinasyon için ayrı stok girebilirsiniz.
               </p>

               <div className="form-row" style={{ gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                     <label>Varyasyon 1</label>
                     <select
                        className="form-select"
                        value={selectedVariationId1}
                        onChange={(e) => handleVariation1Change(e.target.value)}
                     >
                        <option value="">Seçin (opsiyonel)</option>
                        {variations.map(v => (
                           <option key={v._id} value={v._id}>{v.name}</option>
                        ))}
                     </select>
                  </div>

                  {selectedVariationId1 && (
                     <div className="form-group" style={{ flex: 1 }}>
                        <label>Varyasyon 2 (opsiyonel)</label>
                        <select
                           className="form-select"
                           value={selectedVariationId2}
                           onChange={(e) => handleVariation2Change(e.target.value)}
                        >
                           <option value="">Seçin (opsiyonel)</option>
                           {variations
                              .filter(v => v._id !== selectedVariationId1)
                              .map(v => (
                                 <option key={v._id} value={v._id}>{v.name}</option>
                              ))}
                        </select>
                     </div>
                  )}
               </div>

               {variations.length === 0 && (
                  <small className="text-muted">
                     Henüz varyasyon tanımlanmamış.{' '}
                     <a href="/admin/variations" style={{ color: 'var(--color-primary)' }}>Varyasyon tanımla →</a>
                  </small>
               )}

               {variationOptions.length > 0 && (() => {
                  const var1 = variations.find(v => v._id === selectedVariationId1);
                  const var2 = variations.find(v => v._id === selectedVariationId2);
                  const isDual = !!var2;

                  // Build grouped structure for dual variation
                  const buildGroups = () => {
                     if (!isDual) return null;
                     const groups = {};
                     variationOptions.forEach((opt, index) => {
                        const parts = opt.name.split(' | ');
                        if (parts.length !== 2) return;
                        const groupKey = groupBy === 'var1' ? parts[0] : parts[1];
                        const subKey = groupBy === 'var1' ? parts[1] : parts[0];
                        if (!groups[groupKey]) groups[groupKey] = [];
                        groups[groupKey].push({ ...opt, subName: subKey, originalIndex: index });
                     });
                     return groups;
                  };

                  const toggleGroup = (groupName) => {
                     setExpandedGroups(prev => {
                        const next = new Set(prev);
                        if (next.has(groupName)) next.delete(groupName);
                        else next.add(groupName);
                        return next;
                     });
                  };

                  const toggleGroupCheckbox = (groupItems, checked) => {
                     const newOptions = [...variationOptions];
                     groupItems.forEach(item => {
                        newOptions[item.originalIndex].enabled = checked;
                        if (!checked) newOptions[item.originalIndex].stock = 0;
                     });
                     setVariationOptions(newOptions);
                  };

                  const groups = isDual ? buildGroups() : null;

                  return (
                     <div className="variation-stock-section">
                        {/* Grupla dropdown — only for dual variation */}
                        {isDual && (
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                              <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Grupla</span>
                              <select
                                 className="form-select"
                                 style={{ width: 'auto', minWidth: '140px' }}
                                 value={groupBy}
                                 onChange={(e) => {
                                    setGroupBy(e.target.value);
                                    setExpandedGroups(new Set());
                                 }}
                              >
                                 <option value="var2">{var2?.name || 'Varyasyon 2'}</option>
                                 <option value="var1">{var1?.name || 'Varyasyon 1'}</option>
                              </select>
                           </div>
                        )}

                        <table className="variation-stock-table">
                           <thead>
                              <tr>
                                 <th style={{ width: '50px' }}></th>
                                 <th>Varyasyon</th>
                                 <th style={{ width: '150px' }}>Ekstra Fiyat (₺)</th>
                              </tr>
                           </thead>
                           <tbody>
                              {isDual && groups ? (
                                 Object.entries(groups).map(([groupName, items]) => {
                                    const isExpanded = expandedGroups.has(groupName);
                                    const allEnabled = items.every(i => i.enabled);
                                    const someEnabled = items.some(i => i.enabled);
                                    return (
                                       <>
                                          {/* Group header row */}
                                          <tr key={`group-${groupName}`} className="variation-group-header" onClick={() => toggleGroup(groupName)}>
                                             <td onClick={(e) => e.stopPropagation()}>
                                                <input
                                                   type="checkbox"
                                                   className="variation-stock-checkbox"
                                                   checked={allEnabled}
                                                   ref={el => { if (el) el.indeterminate = someEnabled && !allEnabled; }}
                                                   onChange={(e) => toggleGroupCheckbox(items, e.target.checked)}
                                                />
                                             </td>
                                             <td colSpan="2">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                   <span className="variation-group-name">{groupName}</span>
                                                   <span className="variation-group-count">{items.length} kombinasyon</span>
                                                   <span className="variation-group-chevron" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                                                </div>
                                             </td>
                                          </tr>

                                          {/* Sub-rows — visible when expanded */}
                                          {isExpanded && items.map((item) => (
                                             <tr key={item.originalIndex} className="variation-sub-row" style={{ opacity: item.enabled ? 1 : 0.5 }}>
                                                <td>
                                                   <input
                                                      type="checkbox"
                                                      className="variation-stock-checkbox"
                                                      checked={item.enabled}
                                                      onChange={() => toggleVariationOption(item.originalIndex)}
                                                   />
                                                </td>
                                                <td>
                                                   <span className="variation-option-name" style={{ paddingLeft: '1.5rem' }}>{item.subName}</span>
                                                </td>
                                                <td>
                                                   <input
                                                      type="number"
                                                      className="form-input"
                                                      value={item.price === 0 ? '' : item.price}
                                                      onChange={(e) => updateVariationPrice(item.originalIndex, e.target.value)}
                                                      placeholder="0"
                                                      disabled={!item.enabled}
                                                   />
                                                </td>
                                             </tr>
                                          ))}
                                       </>
                                    );
                                 })
                              ) : (
                                 /* Single variation — flat rows */
                                 variationOptions.map((opt, index) => (
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
                                             value={opt.price === 0 ? '' : opt.price}
                                             onChange={(e) => updateVariationPrice(index, e.target.value)}
                                             placeholder="0"
                                             disabled={!opt.enabled}
                                          />
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  );
               })()}
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