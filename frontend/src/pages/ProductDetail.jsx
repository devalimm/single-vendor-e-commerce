import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getImageUrl } from '../utils/api';
import { ShoppingCart, Home, ChevronRight, ChevronLeft } from 'lucide-react';
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
   const [selectedOptions, setSelectedOptions] = useState([]);
   const [quantity, setQuantity] = useState(1);

   // Independent variation selections: { "Beden": {name: "S", extraPrice: 0}, "Boy": {name: "140", extraPrice: 300} }
   const [varSelections, setVarSelections] = useState({});

   useEffect(() => {
      fetchProduct();
   }, [id]);

   const fetchProduct = async () => {
      try {
         setLoading(true);
         const response = await api.get(`/products/${id}`);
         const productData = response.data.data;
         setProduct(productData);
      } catch (err) {
         console.error('Error fetching product:', err);
         setError('Ürün yüklenirken bir hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   // Calculate total extra price from all variation selections
   const getVariationExtraPrice = () => {
      let total = 0;
      Object.values(varSelections).forEach(sel => {
         if (sel && sel.extraPrice) total += sel.extraPrice;
      });
      return total;
   };

   // Check if all required variations are selected
   const allVariationsSelected = () => {
      if (!product?.variationData || product.variationData.length === 0) return true;
      return product.variationData.every(v => varSelections[v.name]);
   };

   // Calculate total price based on selections (without discount)
   const calculateBasePrice = () => {
      if (!product) return 0;

      let price = product.basePrice;

      // Add variation extra prices
      price += getVariationExtraPrice();

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

   const handleVariationSelect = (variationName, option) => {
      setVarSelections(prev => ({
         ...prev,
         [variationName]: { name: option.name, extraPrice: option.extraPrice || 0 }
      }));
   };

   const handleAddToCart = () => {
      if (!isAuthenticated) {
         showToast('Sepete ürün eklemek için giriş yapmalısınız.', 'error');
         navigate('/login');
         return;
      }

      if (!allVariationsSelected()) {
         showToast('Lütfen tüm varyasyonları seçin.', 'error');
         return;
      }

      // Build variationSelections array for cart
      const variationSelections = Object.entries(varSelections).map(([varName, sel]) => ({
         variationName: varName,
         optionName: sel.name,
         extraPrice: sel.extraPrice || 0
      }));

      addToCart(product, {
         variationSelections,
         selectedOptions,
         quantity
      });

      showToast('Ürün sepete eklendi!', 'success');
   };

   if (loading) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   if (error || !product) {
      return (
         <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
            <h2>Ürün Bulunamadı</h2>
            <p className="text-muted">{error}</p>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>Ürünlere Dön</Link>
         </div>
      );
   }

   const discountedPrice = calculateDiscountedPrice();
   const originalPrice = calculateBasePrice();
   const displayPrice = discountedPrice !== null ? discountedPrice : originalPrice;

   return (
      <div className="product-detail-page">
         <div className="container">
            {/* Breadcrumb */}
            <nav className="breadcrumb" style={{ padding: '1rem 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
               <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-text-secondary)' }}>
                  <Home size={14} /> Ana Sayfa
               </Link>
               <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
               <Link to="/products" style={{ color: 'var(--color-text-secondary)' }}>Ürünler</Link>
               {product.category && (
                  <>
                     <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
                     <Link to={`/products?category=${product.category._id}`} style={{ color: 'var(--color-text-secondary)' }}>
                        {product.category.name}
                     </Link>
                  </>
               )}
               <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
               <span style={{ color: 'var(--color-text-primary)' }}>{product.name}</span>
            </nav>

            <div className="product-detail-grid">
               {/* Images Section */}
               <div className="product-detail-images">
                  <div className="main-image-container">
                     {product.images && product.images.length > 0 ? (
                        <>
                           <img
                              src={getImageUrl(product.images[selectedImage])}
                              alt={product.name}
                              className="main-product-image"
                           />
                           {product.images.length > 1 && (
                              <>
                                 <button
                                    className="carousel-arrow carousel-arrow-left"
                                    onClick={() => setSelectedImage(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                                    aria-label="Önceki resim"
                                 >
                                    <ChevronLeft size={24} />
                                 </button>
                                 <button
                                    className="carousel-arrow carousel-arrow-right"
                                    onClick={() => setSelectedImage(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                                    aria-label="Sonraki resim"
                                 >
                                    <ChevronRight size={24} />
                                 </button>
                                 <div className="carousel-dots">
                                    {product.images.map((_, index) => (
                                       <button
                                          key={index}
                                          className={`carousel-dot ${selectedImage === index ? 'active' : ''}`}
                                          onClick={() => setSelectedImage(index)}
                                       />
                                    ))}
                                 </div>
                              </>
                           )}
                        </>
                     ) : (
                        <div className="no-image-placeholder">
                           <p>Resim Yok</p>
                        </div>
                     )}
                  </div>

                  {product.images && product.images.length > 1 && (
                     <div className="thumbnail-grid">
                        {product.images.map((img, index) => (
                           <button
                              key={index}
                              className={`thumbnail-btn ${selectedImage === index ? 'active' : ''}`}
                              onClick={() => setSelectedImage(index)}
                           >
                              <img src={getImageUrl(img)} alt={`${product.name} ${index + 1}`} />
                           </button>
                        ))}
                     </div>
                  )}
               </div>

               {/* Product Info Section */}
               <div className="product-detail-info">
                  {product.category && (
                     <Link to={`/products?category=${product.category._id}`} className="product-detail-category">
                        {product.category.name}
                     </Link>
                  )}

                  <h1 className="product-detail-name">{product.name}</h1>

                  {/* Price */}
                  <div className="product-detail-price">
                     <span className="current-price">
                        {displayPrice.toFixed(2)} ₺
                     </span>
                     {discountedPrice !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <span className="original-price" style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                              {originalPrice.toFixed(2)} ₺
                           </span>
                           {product.discount?.discountPercentage && (
                              <span style={{ background: 'var(--color-error)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                 %{product.discount.discountPercentage}
                              </span>
                           )}
                        </div>
                     )}
                  </div>

                  {product.description && (
                     <p className="product-description">{product.description}</p>
                  )}

                  {/* Independent Variation Selectors */}
                  {product.variationData && product.variationData.length > 0 && (
                     product.variationData.map(variation => (
                        <div className="variant-section" key={variation._id || variation.name}>
                           <label className="variant-label">{variation.name} Seçin:</label>
                           <div className="variant-options">
                              {variation.options.map((opt) => {
                                 const isSelected = varSelections[variation.name]?.name === opt.name;
                                 return (
                                    <button
                                       key={opt.name}
                                       className={`variant-btn ${isSelected ? 'active' : ''}`}
                                       onClick={() => handleVariationSelect(variation.name, opt)}
                                    >
                                       {opt.name}
                                       {opt.extraPrice > 0 && (
                                          <span className="price-badge">+{opt.extraPrice} ₺</span>
                                       )}
                                    </button>
                                 );
                              })}
                           </div>
                        </div>
                     ))
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
                           onClick={() => setQuantity(quantity + 1)}
                        >
                           +
                        </button>
                     </div>
                  </div>

                  {/* Add to Cart Button */}
                  {!allVariationsSelected() ? (
                     <button
                        className="btn btn-secondary btn-block"
                        disabled
                        style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }}
                     >
                        <ShoppingCart size={20} />
                        {product.variationData?.length > 0 ? 'Lütfen Seçimleri Yapınız' : 'Sepete Ekle'}
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
