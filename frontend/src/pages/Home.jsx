import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
   const navigate = useNavigate();
   const [products, setProducts] = useState([]);
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [currentSlide, setCurrentSlide] = useState(0);
   const sliderRef = useRef(null);
   const autoPlayRef = useRef(null);

   // How many products to show per slide (responsive)
   const getProductsPerView = () => {
      if (typeof window !== 'undefined') {
         if (window.innerWidth < 640) return 1;
         if (window.innerWidth < 1024) return 2;
         return 4;
      }
      return 4;
   };

   const [productsPerView, setProductsPerView] = useState(getProductsPerView());

   useEffect(() => {
      const handleResize = () => {
         setProductsPerView(getProductsPerView());
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
   }, []);

   useEffect(() => {
      const fetchData = async () => {
         try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
               api.get('/products?limit=20&sort=-createdAt'),
               api.get('/categories')
            ]);
            setProducts(productsRes.data.data);
            setCategories(categoriesRes.data.data || []);
         } catch (err) {
            console.error('Error fetching data:', err);
            setError('Veriler yüklenirken bir hata oluştu.');
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, []);

   const maxSlide = Math.max(0, products.length - productsPerView);

   // Auto-play slider
   useEffect(() => {
      if (products.length > productsPerView) {
         autoPlayRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev >= maxSlide ? 0 : prev + 1));
         }, 3000);
      }

      return () => {
         if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
         }
      };
   }, [products.length, productsPerView, maxSlide]);

   const nextSlide = () => {
      setCurrentSlide(prev => (prev >= maxSlide ? 0 : prev + 1));
   };

   const prevSlide = () => {
      setCurrentSlide(prev => (prev <= 0 ? maxSlide : prev - 1));
   };

   const goToSlide = (index) => {
      setCurrentSlide(Math.min(Math.max(0, index), maxSlide));
   };

   const handleCategoryClick = (categoryId) => {
      if (categoryId) {
         navigate(`/products?category=${categoryId}`);
      } else {
         navigate('/products');
      }
   };

   if (loading) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   return (
      <div>
         {/* Categories Section - Centered */}
         <section style={{
            background: 'var(--color-bg-secondary)',
            padding: '1rem 0',
            borderBottom: '1px solid var(--color-border)'
         }}>
            <div className="container">
               <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  overflowX: 'auto',
                  paddingBottom: '0.5rem',
                  WebkitOverflowScrolling: 'touch'
               }}>
                  <button
                     onClick={() => handleCategoryClick(null)}
                     style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: 'var(--font-weight-medium)',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease'
                     }}
                  >
                     Tümü
                  </button>
                  {categories.map(category => (
                     <button
                        key={category._id}
                        onClick={() => handleCategoryClick(category._id)}
                        style={{
                           padding: '0.5rem 1.25rem',
                           borderRadius: 'var(--radius-full)',
                           border: '1px solid var(--color-border)',
                           background: 'transparent',
                           color: 'var(--color-text-primary)',
                           cursor: 'pointer',
                           whiteSpace: 'nowrap',
                           fontWeight: 'var(--font-weight-medium)',
                           fontSize: '0.9rem',
                           transition: 'all 0.2s ease'
                        }}
                     >
                        {category.name}
                     </button>
                  ))}
               </div>
            </div>
         </section>

         {/* Latest Products Carousel */}
         {products.length > 0 && (
            <section className="section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
               <div className="container">
                  <div className="section-header" style={{
                     marginBottom: '1.5rem',
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     flexWrap: 'wrap',
                     gap: '1rem'
                  }}>
                     <div>
                        <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                           Son Eklenen Ürünler
                        </h2>
                        <p className="section-subtitle" style={{ fontSize: '0.9rem' }}>
                           En yeni {products.length} ürün
                        </p>
                     </div>
                     <Link to="/products" className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        Tümünü Gör
                     </Link>
                  </div>

                  {/* Slider Container */}
                  <div style={{ position: 'relative' }}>
                     {/* Navigation Arrows */}
                     {products.length > productsPerView && (
                        <>
                           <button
                              onClick={prevSlide}
                              style={{
                                 position: 'absolute',
                                 left: '-15px',
                                 top: '50%',
                                 transform: 'translateY(-50%)',
                                 zIndex: 10,
                                 background: 'white',
                                 border: '1px solid var(--color-border)',
                                 borderRadius: '50%',
                                 width: '36px',
                                 height: '36px',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 cursor: 'pointer',
                                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                              aria-label="Önceki"
                           >
                              <ChevronLeft size={20} />
                           </button>
                           <button
                              onClick={nextSlide}
                              style={{
                                 position: 'absolute',
                                 right: '-15px',
                                 top: '50%',
                                 transform: 'translateY(-50%)',
                                 zIndex: 10,
                                 background: 'white',
                                 border: '1px solid var(--color-border)',
                                 borderRadius: '50%',
                                 width: '36px',
                                 height: '36px',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 cursor: 'pointer',
                                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                              aria-label="Sonraki"
                           >
                              <ChevronRight size={20} />
                           </button>
                        </>
                     )}

                     {/* Slider Track */}
                     <div style={{ overflow: 'hidden', margin: '0 5px' }}>
                        <div
                           ref={sliderRef}
                           style={{
                              display: 'flex',
                              gap: '1rem',
                              transform: `translateX(-${currentSlide * (100 / productsPerView + 1)}%)`,
                              transition: 'transform 0.5s ease-in-out'
                           }}
                        >
                           {products.map(product => (
                              <div
                                 key={product._id}
                                 style={{
                                    flex: `0 0 calc(${100 / productsPerView}% - 0.75rem)`,
                                    minWidth: `calc(${100 / productsPerView}% - 0.75rem)`
                                 }}
                              >
                                 <ProductCard product={product} />
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Dots Indicator */}
                     {products.length > productsPerView && (
                        <div style={{
                           display: 'flex',
                           justifyContent: 'center',
                           gap: '0.4rem',
                           marginTop: '1rem'
                        }}>
                           {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                              <button
                                 key={index}
                                 onClick={() => goToSlide(index)}
                                 style={{
                                    width: currentSlide === index ? '20px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: currentSlide === index ? 'var(--color-primary)' : 'var(--color-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                 }}
                                 aria-label={`Slide ${index + 1}`}
                              />
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </section>
         )}

         {/* Empty State */}
         {!loading && products.length === 0 && (
            <section className="section">
               <div className="container text-center" style={{ padding: '4rem 0' }}>
                  <h3>Henüz ürün eklenmemiş</h3>
                  <p className="text-muted">Yakında harika ürünlerle karşınızda olacağız!</p>
               </div>
            </section>
         )}

         {error && (
            <div className="container">
               <div className="alert alert-error">{error}</div>
            </div>
         )}
      </div>
   );
};

export default Home;
