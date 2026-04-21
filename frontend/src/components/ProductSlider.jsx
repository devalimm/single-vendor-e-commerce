import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

const getMaxSlide = (itemsLength, productsPerView) => Math.max(0, itemsLength - productsPerView);

const ProductSlider = ({ items, initialSlide = 0 }) => {
   const [slide, setSlide] = useState(initialSlide);
   const [productsPerView, setProductsPerView] = useState(4);

   useEffect(() => {
      const getProductsPerView = () => {
         if (typeof window === 'undefined') return 4;
         if (window.innerWidth < 640) return 2;
         if (window.innerWidth < 1024) return 3;
         return 4;
      };
      setProductsPerView(getProductsPerView());
      const handleResize = () => setProductsPerView(getProductsPerView());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
   }, []);

   if (!items?.length) return null;

   const maxSlide = getMaxSlide(items.length, productsPerView);
   const gap = 16;

   return (
      <div style={{ position: 'relative' }}>
         {items.length > productsPerView && (
            <>
               <button
                  onClick={() => setSlide(prev => prev <= 0 ? maxSlide : prev - 1)}
                  style={{
                     position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)',
                     zIndex: 10, background: 'white', border: '1px solid var(--color-border)',
                     borderRadius: '50%', width: '36px', height: '36px',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  aria-label="Önceki"
               >
                  <ChevronLeft size={20} />
               </button>
               <button
                  onClick={() => setSlide(prev => prev >= maxSlide ? 0 : prev + 1)}
                  style={{
                     position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)',
                     zIndex: 10, background: 'white', border: '1px solid var(--color-border)',
                     borderRadius: '50%', width: '36px', height: '36px',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  aria-label="Sonraki"
               >
                  <ChevronRight size={20} />
               </button>
            </>
         )}

         <div style={{ overflow: 'hidden', margin: '0 5px' }}>
            <div
               style={{
                  display: 'flex', gap: `${gap}px`,
                  transform: `translateX(calc(-${slide * (100 / productsPerView)}% - ${slide * gap / productsPerView}px))`,
                  transition: 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)'
               }}
            >
               {items.map(product => (
                  <div
                     key={product._id}
                     style={{
                        flex: `0 0 calc(${100 / productsPerView}% - ${(productsPerView - 1) * gap / productsPerView}px)`,
                        minWidth: `calc(${100 / productsPerView}% - ${(productsPerView - 1) * gap / productsPerView}px)`
                     }}
                  >
                     <ProductCard product={product} />
                  </div>
               ))}
            </div>
         </div>

         {items.length > productsPerView && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
               {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                  <button
                     key={index}
                     onClick={() => setSlide(index)}
                     style={{
                        width: slide === index ? '20px' : '8px', height: '8px',
                        borderRadius: '4px', border: 'none',
                        background: slide === index ? 'var(--color-primary)' : 'var(--color-border)',
                        cursor: 'pointer', transition: 'all 0.3s ease'
                     }}
                     aria-label={`Slide ${index + 1}`}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

export default ProductSlider;