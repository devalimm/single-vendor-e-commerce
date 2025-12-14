import { useState, useEffect } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';

const Home = () => {
   const [newProducts, setNewProducts] = useState([]);
   const [allProducts, setAllProducts] = useState([]);
   const [filteredProducts, setFilteredProducts] = useState([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   useEffect(() => {
      const fetchProducts = async () => {
         try {
            setLoading(true);

            const [newRes, allRes] = await Promise.all([
               api.get('/products/new?limit=8'),
               api.get('/products?limit=12')
            ]);

            setNewProducts(newRes.data.data);
            setAllProducts(allRes.data.data);
         } catch (err) {
            console.error('Error fetching products:', err);
            setError('Ürünler yüklenirken bir hata oluştu.');
         } finally {
            setLoading(false);
         }
      };

      fetchProducts();
   }, []);

   // Filter products based on search query
   useEffect(() => {
      if (searchQuery.trim() === '') {
         setFilteredProducts(allProducts);
      } else {
         const filtered = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
         );
         setFilteredProducts(filtered);
      }
   }, [searchQuery, allProducts]);

   if (loading) {
      return (
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner"></div>
         </div>
      );
   }

   return (
      <div>
         {/* Search Bar Section with Background */}
         <section style={{
            background: 'linear-gradient(135deg, hsl(340, 82%, 96%), hsl(280, 40%, 96%))',
            padding: '2rem 0'
         }}>
            <div className="container">
               <div className="search-bar-wrapper">
                  <div className="search-bar">
                     <Search size={20} className="search-icon" />
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
               </div>
            </div>
         </section>

         {/* New Products Section */}
         {newProducts.length > 0 && (
            <section className="section" style={{ paddingTop: '2rem' }}>
               <div className="container">
                  <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                     <h2 className="section-title" style={{ fontSize: '1.75rem' }}>Yeni Ürünler</h2>
                     <p className="section-subtitle">En son eklenen ürünlerimizi keşfedin</p>
                  </div>

                  <div className="products-grid">
                     {newProducts.map(product => (
                        <ProductCard key={product._id} product={product} />
                     ))}
                  </div>
               </div>
            </section>
         )}

         {/* Best Selling Section */}


         {/* All Products Section - Show when no new products OR when searching */}
         {(allProducts.length > 0 && newProducts.length === 0) || searchQuery ? (
            <section className="section" style={{ paddingTop: '2rem' }}>
               <div className="container">
                  <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                     <h2 className="section-title" style={{ fontSize: '1.75rem' }}>
                        {searchQuery ? 'Arama Sonuçları' : 'Tüm Ürünler'}
                     </h2>
                     <p className="section-subtitle">
                        {searchQuery
                           ? `${filteredProducts.length} ürün bulundu`
                           : 'Koleksiyonumuzu keşfedin'
                        }
                     </p>
                  </div>

                  {filteredProducts.length > 0 ? (
                     <div className="products-grid">
                        {filteredProducts.map(product => (
                           <ProductCard key={product._id} product={product} />
                        ))}
                     </div>
                  ) : (
                     <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <p className="text-muted">Arama kriterlerinize uygun ürün bulunamadı.</p>
                     </div>
                  )}
               </div>
            </section>
         ) : null}

         {/* Empty State */}
         {!loading && newProducts.length === 0 && allProducts.length === 0 && (
            <section className="section">
               <div className="container text-center">
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
