import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductSlider from '../components/ProductSlider';

const Home = () => {
   const navigate = useNavigate();
   const [products, setProducts] = useState([]);
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const autoPlayRef = useRef(null);

   useEffect(() => {
      const fetchData = async () => {
         try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
               api.get('/products?limit=20&sort=-createdAt'),
               api.get('/categories')
            ]);
            setProducts(productsRes.data.data || []);
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

   const discountedProducts = products.filter(p => p.discount && p.discount.discountedPrice < p.basePrice);
   const bestSellers = [...products].filter(p => p.salesCount > 0).sort((a, b) => b.salesCount - a.salesCount);

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
         <section style={{
            background: 'var(--color-bg-secondary)',
            padding: '1rem 0',
            borderBottom: '1px solid var(--color-border)'
         }}>
            <div className="container">
               <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem',
                  WebkitOverflowScrolling: 'touch'
               }}>
                  <button
                     onClick={() => handleCategoryClick(null)}
                     style={{
                        padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-border)', background: 'transparent',
                        color: 'var(--color-text-primary)', cursor: 'pointer', whiteSpace: 'nowrap',
                        fontWeight: 'var(--font-weight-medium)', fontSize: '0.9rem',
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
                           padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)',
                           border: '1px solid var(--color-border)', background: 'transparent',
                           color: 'var(--color-text-primary)', cursor: 'pointer', whiteSpace: 'nowrap',
                           fontWeight: 'var(--font-weight-medium)', fontSize: '0.9rem',
                           transition: 'all 0.2s ease'
                        }}
                     >
                        {category.name}
                     </button>
                  ))}
               </div>
            </div>
         </section>

         {products.length > 0 && (
            <section style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
               <div className="container">
                  <div style={{
                     marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between',
                     alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                  }}>
                     <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Son Eklenen Ürünler</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                           En yeni {products.length} ürün
                        </p>
                     </div>
                     <Link to="/products" className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        Tümünü Gör
                     </Link>
                  </div>
                  <ProductSlider items={products} />
               </div>
            </section>
         )}

         {discountedProducts.length > 0 && (
            <section style={{ paddingTop: '0', paddingBottom: '2rem' }}>
               <div className="container">
                  <div style={{
                     marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between',
                     alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                  }}>
                     <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>İndirimli Ürünler</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                           {discountedProducts.length} üründe fırsat
                        </p>
                     </div>
                     <Link to="/products" className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        Tümünü Gör
                     </Link>
                  </div>
                  <ProductSlider items={discountedProducts} />
               </div>
            </section>
         )}

         {bestSellers.length > 0 && (
            <section style={{ paddingTop: '0', paddingBottom: '2rem' }}>
               <div className="container">
                  <div style={{
                     marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between',
                     alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                  }}>
                     <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Çok Satanlar</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                           En popüler ürünler
                        </p>
                     </div>
                     <Link to="/products" className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        Tümünü Gör
                     </Link>
                  </div>
                  <ProductSlider items={bestSellers} />
               </div>
            </section>
         )}

         {!loading && products.length === 0 && (
            <section>
               <div className="container text-center" style={{ padding: '4rem 0' }}>
                  <h3>Henüz ürün eklenmemiş</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Yakında harika ürünlerle karşınızda olacağız!</p>
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