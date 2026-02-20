import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { ShoppingCart, Home, ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const { showToast } = useToast();
   const { addToCart } = useCart();
   const { isAuthenticated } = useAuth();

   const [product, setProduct] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   // Selection state
   const [selectedImage, setSelectedImage] = useState(0);
   const [selectedSize, setSelectedSize] = useState(null);
   const [selectedLength, setSelectedLength] = useState(null);
   const [selectedOptions, setSelectedOptions] = useState([]);
   const [quantity, setQuantity] = useState(1);

   // Dual variation selection state
   const [varSelection1, setVarSelection1] = useState('');
   const [varSelection2, setVarSelection2] = useState('');

   const isDualVariation = product?.selectedVariations?.length === 2;

   useEffect(() => {
      fetchProduct();
   }, [id]);

   const fetchProduct = async () => {
      try {
         setLoading(true);
         const response = await api.get(`/products/${id}`);
         const productData = response.data.data;
         setProduct(productData);

         // Set default selections
         if (productData.selectedVariations?.length === 2) {
            // Dual variation — don't auto-select, user picks both
            setSelectedSize(null);
         } else if (productData.sizes?.length > 0) {
            const firstInStockSize = productData.sizes.find(size => size.stock > 0);
            setSelectedSize(firstInStockSize || null);
         }
         if (productData.lengths?.length > 0) {
            setSelectedLength(productData.lengths[0]);
         }
      } catch (err) {
         console.error('Error fetching product:', err);
         setError('Ürün yüklenirken bir hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   // --- Dual variation helpers ---
   const getVariation1Options = () => {
      if (!isDualVariation || !product?.sizes) return [];
      const names = new Set();
      product.sizes.forEach(s => {
         const parts = s.name.split(' | ');
         if (parts.length === 2) names.add(parts[0]);
      });
      return [...names];
   };

   const getVariation2Options = () => {
      if (!isDualVariation || !product?.sizes) return [];
      const names = new Set();
      product.sizes.forEach(s => {
         const parts = s.name.split(' | ');
         if (parts.length === 2) {
            // Only show options where var1 matches (if selected) and has stock
            if (!varSelection1 || parts[0] === varSelection1) {
               names.add(parts[1]);
            }
         }
      });
      return [...names];
   };

   const getDualVariationStock = (v1, v2) => {
      if (!product?.sizes) return 0;
      const combo = product.sizes.find(s => s.name === `${v1} | ${v2}`);
      return combo ? combo.stock : 0;
   };

   const handleDualVariationSelect = (slot, value) => {
      let newV1 = slot === 1 ? value : varSelection1;
      let newV2 = slot === 2 ? value : varSelection2;

      if (slot === 1) {
         setVarSelection1(value);
         // Reset var2 if the current var2 is not available with the new var1
         if (newV2) {
            const combo = product.sizes.find(s => s.name === `${value} | ${newV2}`);
            if (!combo) {
               newV2 = '';
               setVarSelection2('');
            }
         }
      } else {
         setVarSelection2(value);
      }

      // If both selected, find the matching size entry
      if (newV1 && newV2) {
         const comboName = `${newV1} | ${newV2}`;
         const sizeEntry = product.sizes.find(s => s.name === comboName);
         setSelectedSize(sizeEntry && sizeEntry.stock > 0 ? sizeEntry : null);
      } else {
         setSelectedSize(null);
      }
   };

   // Calculate total price based on selections (without discount)
   const calculateBasePrice = () => {
      if (!product) return 0;

      let price = product.basePrice;

      // Add length adjustment
      if (selectedLength?.priceAdjustment) {
         price += selectedLength.priceAdjustment;
      }

      // Add selected options prices
      selectedOptions.forEach(option => {
         price += option.price || 0;
      });

      return price;
   };

   // Calculate discounted price
   const calculateDiscountedPrice = () => {
      if (!product || !product.discount) return null;

      const baseTotal = calculateBasePrice();
      const discount = product.discount;

      if (discount.type === 'percentage') {
         return baseTotal * (1 - discount.value / 100);
      } else {
         // fixed_amount — sabit indirim basePrice üzerinden
         return Math.max(0, baseTotal - discount.value);
      }
   };

   const handleOptionToggle = (option) => {
      const isSelected = selectedOptions.find(o => o.name === option.name);
      if (isSelected) {
         setSelectedOptions(selectedOptions.filter(o => o.name !== option.name));
      } else {
         setSelectedOptions([...selectedOptions, option]);
      }
   };

   const handleAddToCart = () => {
      // Check authentication
      if (!isAuthenticated) {
         showToast('Sepete ürün eklemek için giriş yapmalısınız.', 'error');
         navigate('/login');
         return;
      }

      // Validation
      if (product.sizes?.length > 0 && !selectedSize) {
         showToast('Lütfen bir beden seçin.', 'error');
         return;
      }

      if (selectedSize && selectedSize.stock < quantity) {
         showToast('Seçilen bedende yeterli stok yok.', 'error');
         return;
      }

      // Add to cart
      addToCart(product, {
         selectedSize,
         selectedLength,
         selectedOptions,
         quantity
      });

      showToast('Ürün sepete eklendi!', 'success');
   };

   if (loading) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   if (error || !product) {
      return (
         <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
            <h2>Ürün bulunamadı</h2>
            <p className="text-muted">{error}</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
               Ana Sayfaya Dön
            </Link>
         </div>
      );
   }

   const originalPrice = calculateBasePrice();
   const discountedPrice = calculateDiscountedPrice();
   const hasDiscount = discountedPrice !== null && discountedPrice < originalPrice;
   const displayPrice = hasDiscount ? discountedPrice : originalPrice;

   const mainImage = product.images?.[selectedImage]
      ? `http://localhost:5000${product.images[selectedImage]}`
      : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="800"%3E%3Crect fill="%23f0f0f0" width="600" height="800"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle"%3EResim Yok%3C/text%3E%3C/svg%3E';

   return (
      <div className="product-detail-page">
         {/* Breadcrumb */}
         <div className="container" style={{ padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
               <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Home size={16} /> Ana Sayfa
               </Link>
               <ChevronRight size={16} />
               {product.category && (
                  <>
                     <span>{product.category.name}</span>
                     <ChevronRight size={16} />
                  </>
               )}
               <span style={{ color: 'var(--color-text-primary)' }}>{product.name}</span>
            </div>
         </div>

         <div className="container" style={{ padding: '2rem 0' }}>
            <div className="product-detail-grid">
               {/* Image Gallery */}
               <div className="product-gallery">
                  <div className="main-image">
                     <img src={mainImage} alt={product.name} />
                     {hasDiscount && (
                        <span className="product-badge badge-discount" style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                           %{product.discount.discountPercentage} İndirim
                        </span>
                     )}
                  </div>
                  {product.images?.length > 1 && (
                     <div className="image-thumbnails">
                        {product.images.map((image, index) => (
                           <div
                              key={index}
                              className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                              onClick={() => setSelectedImage(index)}
                           >
                              <img src={`http://localhost:5000${image}`} alt={`${product.name} ${index + 1}`} />
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* Product Info */}
               <div className="product-info-section">
                  <h1 className="product-title">{product.name}</h1>

                  {product.category && (
                     <p className="product-category">{product.category.name}</p>
                  )}

                  {product.sku && (
                     <p className="product-sku">Stok Kodu: {product.sku}</p>
                  )}

                  {/* Price Section */}
                  <div className="product-price-section">
                     {hasDiscount ? (
                        <>
                           <span className="product-price-original-lg">{originalPrice.toFixed(2)} ₺</span>
                           <span className="product-price-discount-lg">{discountedPrice.toFixed(2)} ₺</span>
                           <span className="product-discount-info">
                              {product.discount.name} — %{product.discount.discountPercentage} indirim
                           </span>
                        </>
                     ) : (
                        <div className="product-price">
                           {originalPrice.toFixed(2)} ₺
                        </div>
                     )}
                  </div>

                  {product.description && (
                     <p className="product-description">{product.description}</p>
                  )}

                  {/* Size / Variation Selector */}
                  {isDualVariation ? (
                     <>
                        {/* Dual variation — 2 separate selectors */}
                        <div className="variant-section">
                           <label className="variant-label">{product.selectedVariations[0]} Seçin:</label>
                           <div className="variant-options">
                              {getVariation1Options().map((opt) => {
                                 // Check if any combo with this opt has stock
                                 const hasStock = product.sizes.some(s => s.name.startsWith(opt + ' | ') && s.stock > 0);
                                 return (
                                    <button
                                       key={opt}
                                       className={`variant-btn ${varSelection1 === opt ? 'active' : ''} ${!hasStock ? 'disabled' : ''}`}
                                       onClick={() => hasStock && handleDualVariationSelect(1, opt)}
                                       disabled={!hasStock}
                                    >
                                       {opt}
                                       {!hasStock && <span className="out-of-stock-badge">Tükendi</span>}
                                    </button>
                                 );
                              })}
                           </div>
                        </div>

                        {varSelection1 && (
                           <div className="variant-section">
                              <label className="variant-label">{product.selectedVariations[1]} Seçin:</label>
                              <div className="variant-options">
                                 {getVariation2Options().map((opt) => {
                                    const stock = getDualVariationStock(varSelection1, opt);
                                    return (
                                       <button
                                          key={opt}
                                          className={`variant-btn ${varSelection2 === opt ? 'active' : ''} ${stock === 0 ? 'disabled' : ''}`}
                                          onClick={() => stock > 0 && handleDualVariationSelect(2, opt)}
                                          disabled={stock === 0}
                                       >
                                          {opt}
                                          {stock === 0 && <span className="out-of-stock-badge">Tükendi</span>}
                                       </button>
                                    );
                                 })}
                              </div>
                           </div>
                        )}

                        {selectedSize && selectedSize.stock > 0 && (
                           <p className="stock-info">Stok: {selectedSize.stock} adet</p>
                        )}
                     </>
                  ) : product.sizes?.length > 0 && (
                     <div className="variant-section">
                        <label className="variant-label">
                           {product.selectedVariations?.[0] || 'Beden'} Seçin:
                        </label>
                        <div className="variant-options">
                           {product.sizes.map((size) => (
                              <button
                                 key={size.name}
                                 className={`variant-btn ${selectedSize?.name === size.name ? 'active' : ''} ${size.stock === 0 ? 'disabled' : ''}`}
                                 onClick={() => size.stock > 0 && setSelectedSize(size)}
                                 disabled={size.stock === 0}
                              >
                                 {size.name}
                                 {size.stock === 0 && <span className="out-of-stock-badge">Tükendi</span>}
                              </button>
                           ))}
                        </div>
                        {selectedSize && selectedSize.stock > 0 && (
                           <p className="stock-info">Stok: {selectedSize.stock} adet</p>
                        )}
                     </div>
                  )}

                  {/* Length Selector */}
                  {product.lengths?.length > 0 && (
                     <div className="variant-section">
                        <label className="variant-label">Boy Seçin:</label>
                        <div className="variant-options">
                           {product.lengths.map((length) => (
                              <button
                                 key={length.name}
                                 className={`variant-btn ${selectedLength?.name === length.name ? 'active' : ''}`}
                                 onClick={() => setSelectedLength(length)}
                              >
                                 {length.name}cm
                                 {length.priceAdjustment > 0 && (
                                    <span className="price-badge">+{length.priceAdjustment.toFixed(2)} ₺</span>
                                 )}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Options Selector */}
                  {product.options?.length > 0 && (
                     <div className="variant-section">
                        <label className="variant-label">Seçenekler:</label>
                        <div className="variant-options">
                           {product.options.map((option) => (
                              <button
                                 key={option.name}
                                 className={`variant-btn ${selectedOptions.find(o => o.name === option.name) ? 'active' : ''}`}
                                 onClick={() => handleOptionToggle(option)}
                              >
                                 {option.name}
                                 {option.price > 0 && (
                                    <span className="price-badge">+{option.price.toFixed(2)} ₺</span>
                                 )}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="quantity-section">
                     <label className="variant-label">Adet:</label>
                     <div className="quantity-controls">
                        <button
                           className="quantity-btn"
                           onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                           -
                        </button>
                        <span className="quantity-display">{quantity}</span>
                        <button
                           className="quantity-btn"
                           onClick={() => {
                              const maxStock = selectedSize?.stock || 999;
                              setQuantity(Math.min(maxStock, quantity + 1));
                           }}
                        >
                           +
                        </button>
                     </div>
                  </div>

                  {/* Add to Cart Button */}
                  {!selectedSize || selectedSize.stock === 0 ? (
                     <button
                        className="btn btn-secondary btn-block"
                        disabled
                        style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }}
                     >
                        <ShoppingCart size={20} />
                        {!selectedSize ? 'Beden Seçiniz' : 'Stokta Yok'}
                     </button>
                  ) : (
                     <button
                        className="btn btn-primary btn-block"
                        onClick={handleAddToCart}
                        style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                     >
                        <ShoppingCart size={20} />
                        Sepete Ekle - {(displayPrice * quantity).toFixed(2)} ₺
                     </button>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default ProductDetail;
