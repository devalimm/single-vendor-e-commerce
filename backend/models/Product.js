import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Ürün adı gereklidir'],
      trim: true
   },
   description: {
      type: String,
      default: ''
   },
   basePrice: {
      type: Number,
      required: [true, 'Fiyat gereklidir'],
      min: [0, 'Fiyat negatif olamaz']
   },
   vatRate: {
      type: Number,
      default: 20, // Default 20% KDV for Turkey
      min: [0, 'KDV oranı negatif olamaz'],
      max: [100, 'KDV oranı 100\'den büyük olamaz']
   },
   images: [{
      type: String // Array of image paths
   }],
   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Kategori gereklidir']
   },
   sku: {
      type: String,
      trim: true,
      default: ''
   },

   // Sizes available for this product (also stores variation combinations via " | " separator)
   sizes: [{
      name: {
         type: String,
         required: true
      },
      stock: {
         type: Number,
         default: 0,
         min: 0
      }
   }],

   // Which variation types are used for this product (max 2)
   // e.g. ["Beden"] or ["Beden", "Renk"]
   selectedVariations: [{
      type: String,
      trim: true
   }],

   // Lengths available for this product
   lengths: [{
      name: {
         type: String,
         required: true
      },
      priceAdjustment: {
         type: Number,
         default: 0 // Can be positive or negative
      }
   }],

   // Additional options (şal, etek, etc.) - Shopier style
   options: [{
      name: {
         type: String,
         required: true
      },
      price: {
         type: Number,
         required: true,
         min: 0
      },
      description: String
   }],

   // Product status and metrics
   isActive: {
      type: Boolean,
      default: true
   },
   isFeatured: {
      type: Boolean,
      default: false
   },
   isNew: {
      type: Boolean,
      default: true
   },
   salesCount: {
      type: Number,
      default: 0,
      min: 0
   },
   viewCount: {
      type: Number,
      default: 0,
      min: 0
   },

   // SEO and metadata
   slug: {
      type: String,
      unique: true
   },
   tags: [String],

   // Stock management
   totalStock: {
      type: Number,
      default: 0,
      min: 0
   }
}, {
   timestamps: true,
   suppressReservedKeysWarning: true
});

// Generate slug from name before saving
productSchema.pre('save', function (next) {
   if (this.isModified('name')) {
      const timestamp = Date.now().toString(36);
      this.slug = this.name
         .toLowerCase()
         .replace(/ğ/g, 'g')
         .replace(/ü/g, 'u')
         .replace(/ş/g, 's')
         .replace(/ı/g, 'i')
         .replace(/ö/g, 'o')
         .replace(/ç/g, 'c')
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/^-+|-+$/g, '') + '-' + timestamp;
   }
   next();
});

// Calculate total stock from sizes
productSchema.pre('save', function (next) {
   if (this.sizes && this.sizes.length > 0) {
      this.totalStock = this.sizes.reduce((total, size) => total + (size.stock || 0), 0);
   }
   next();
});

// Virtual for checking if in stock
productSchema.virtual('inStock').get(function () {
   return this.totalStock > 0;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
