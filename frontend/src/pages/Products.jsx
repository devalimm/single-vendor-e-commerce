import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Search, ChevronLeft, ChevronRight, Package } from 'lucide-react';

const Products = () => {
   const [searchParams, setSearchParams] = useSearchParams();
   const [products, setProducts] = useState([]);
   const [categories, setCategories] = useState([]);
   const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [searchQuery, setSearchQuery] = useState('');

   // Pagination
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalProducts, setTotalProducts] = useState(0);
   const productsPerPage = 12;

   useEffect(() => {
      fetchCategories();
   }, []);

   useEffect(() => {
      // Update selectedCategory when URL changes
      const categoryFromUrl = searchParams.get('category');
      setSelectedCategory(categoryFromUrl);
      setCurrentPage(1);
   }, [searchParams]);

   useEffect(() => {
      fetchProducts();
   }, [currentPage, selectedCategory]);

   const fetchCategories = async () => {
      try {
         const response = await api.get('/categories');
         setCategories(response.data.data || []);
      } catch (err) {
         console.error('Error fetching categories:', err);
      }
   };

   const fetchProducts = async () => {
      try {
         setLoading(true);
         let url = `/products?page=${currentPage}&limit=${productsPerPage}`;
         if (selectedCategory) {
            url += `&category=${selectedCategory}`;
         }
         const response = await api.get(url);
         setProducts(response.data.data);
         setTotalPages(response.data.pages || 1);
         setTotalProducts(response.data.total || 0);
      } catch (err) {
         console.error('Error fetching products:', err);
         setError('Ürünler yüklenirken bir hata oluştu.');
      } finally {
         setLoading(false);
      }
   };

   // Filter products based on search (client-side)
   const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const handleCategoryChange = (categoryId) => {
      if (categoryId) {
         setSearchParams({ category: categoryId });
      } else {
         setSearchParams({});
      }
      setSearchQuery('');
   };

   const handlePageChange = (page) => {
      if (page >= 1 && page <= totalPages) {
         setCurrentPage(page);
         window.scrollTo({ top: 0, behavior: 'smooth' });
      }
   };

   // Generate page numbers for pagination
   const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
         for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
         }
      } else {
         if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) {
               pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
         } else if (currentPage >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) {
               pages.push(i);
            }
         } else {
            pages.push(1);
            pages.push('...');
            pages.push(currentPage - 1);
            pages.push(currentPage);
            pages.push(currentPage + 1);
            pages.push('...');
            pages.push(totalPages);
         }
      }

      return pages;
   };

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
                     onClick={() => handleCategoryChange(null)}
                     style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid',
                        borderColor: !selectedCategory ? 'var(--color-primary)' : 'var(--color-border)',
                        background: !selectedCategory ? 'var(--color-primary)' : 'transparent',
                        color: !selectedCategory ? 'white' : 'var(--color-text-primary)',
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
                        onClick={() => handleCategoryChange(category._id)}
                        style={{
                           padding: '0.5rem 1.25rem',
                           borderRadius: 'var(--radius-full)',
                           border: '1px solid',
                           borderColor: selectedCategory === category._id ? 'var(--color-primary)' : 'var(--color-border)',
                           background: selectedCategory === category._id ? 'var(--color-primary)' : 'transparent',
                           color: selectedCategory === category._id ? 'white' : 'var(--color-text-primary)',
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

         <div className="container" style={{ padding: '1.5rem 0' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
               <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                  {selectedCategory
                     ? categories.find(c => c._id === selectedCategory)?.name || 'Ürünler'
                     : 'Tüm Ürünler'}
               </h1>
               <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {totalProducts} ürün
               </p>
            </div>

            {/* Search Bar - Above Products */}
            <div style={{ marginBottom: '1.5rem' }}>
               <div className="search-bar" style={{ maxWidth: '400px' }}>
                  <Search size={18} className="search-icon" />
                  <input
                     type="text"
                     placeholder="Ürün ara..."
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
                  <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                     {filteredProducts.length} sonuç bulundu
                  </p>
               )}
            </div>

            {/* Loading */}
            {loading && (
               <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                  <div className="spinner"></div>
               </div>
            )}

            {/* Error */}
            {error && (
               <div className="alert alert-error">{error}</div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
               <>
                  {filteredProducts.length > 0 ? (
                     <div className="products-grid">
                        {filteredProducts.map(product => (
                           <ProductCard key={product._id} product={product} />
                        ))}
                     </div>
                  ) : (
                     <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <Package size={64} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                        <h3>Ürün Bulunamadı</h3>
                        <p className="text-muted">
                           {searchQuery
                              ? 'Arama kriterlerinize uygun ürün bulunamadı.'
                              : 'Bu kategoride henüz ürün bulunmuyor.'}
                        </p>
                        {selectedCategory && (
                           <button
                              onClick={() => handleCategoryChange(null)}
                              className="btn btn-primary"
                              style={{ marginTop: '1rem' }}
                           >
                              Tüm Ürünleri Göster
                           </button>
                        )}
                     </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && !searchQuery && (
                     <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '2rem',
                        flexWrap: 'wrap'
                     }}>
                        {/* Previous Button */}
                        <button
                           onClick={() => handlePageChange(currentPage - 1)}
                           disabled={currentPage === 1}
                           className="btn btn-secondary"
                           style={{
                              padding: '0.5rem 0.75rem',
                              opacity: currentPage === 1 ? 0.5 : 1,
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                           }}
                        >
                           <ChevronLeft size={18} />
                        </button>

                        {/* Page Numbers */}
                        {getPageNumbers().map((page, index) => (
                           page === '...' ? (
                              <span key={`dots-${index}`} style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                 ...
                              </span>
                           ) : (
                              <button
                                 key={page}
                                 onClick={() => handlePageChange(page)}
                                 className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                                 style={{
                                    padding: '0.5rem 0.75rem',
                                    minWidth: '40px',
                                    fontSize: '0.9rem'
                                 }}
                              >
                                 {page}
                              </button>
                           )
                        ))}

                        {/* Next Button */}
                        <button
                           onClick={() => handlePageChange(currentPage + 1)}
                           disabled={currentPage === totalPages}
                           className="btn btn-secondary"
                           style={{
                              padding: '0.5rem 0.75rem',
                              opacity: currentPage === totalPages ? 0.5 : 1,
                              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                           }}
                        >
                           <ChevronRight size={18} />
                        </button>
                     </div>
                  )}

                  {/* Page Info */}
                  {totalPages > 1 && (
                     <p style={{
                        textAlign: 'center',
                        marginTop: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.85rem'
                     }}>
                        Sayfa {currentPage} / {totalPages}
                     </p>
                  )}
               </>
            )}
         </div>
      </div>
   );
};

export default Products;
