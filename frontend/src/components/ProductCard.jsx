import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
   // Create a simple SVG placeholder
   const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"%3E%3Crect fill="%23f0f0f0" width="300" height="400"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EResim Yok%3C/text%3E%3C/svg%3E';

   const mainImage = product.images && product.images.length > 0
      ? `http://localhost:5000${product.images[0]}`
      : placeholderImage;

   return (
      <Link to={`/products/${product._id}`} className="product-card">
         <div className="product-image-wrapper">
            <img
               src={mainImage}
               alt={product.name}
               className="product-image"
               onError={(e) => {
                  e.target.src = placeholderImage;
               }}
            />
            {product.isNew && (
               <span className="product-badge badge-new">Yeni</span>
            )}
            {product.isFeatured && (
               <span className="product-badge badge-featured">Öne Çıkan</span>
            )}
            {product.totalStock === 0 && (
               <span className="product-badge badge-out-of-stock">Tükendi</span>
            )}
         </div>

         <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            {product.category && (
               <p className="product-category">{product.category.name}</p>
            )}
            <div className="product-footer">
               <span className="product-price">{product.basePrice.toFixed(2)} ₺</span>
               {product.salesCount > 0 && (
                  <span className="product-sales">
                     {product.salesCount} satış
                  </span>
               )}
            </div>
         </div>
      </Link>
   );
};

export default ProductCard;
