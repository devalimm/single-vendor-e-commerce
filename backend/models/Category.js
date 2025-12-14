import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Kategori adı gereklidir'],
      unique: true,
      trim: true
   },
   slug: {
      type: String,
      unique: true,
      lowercase: true
   },
   description: {
      type: String,
      trim: true
   },
   image: {
      type: String // Optional category image
   },
   isActive: {
      type: Boolean,
      default: true
   }
}, {
   timestamps: true
});

// Generate slug from name before saving
categorySchema.pre('save', function (next) {
   if (this.isModified('name')) {
      // Simple slug generation (Turkish character support)
      this.slug = this.name
         .toLowerCase()
         .replace(/ğ/g, 'g')
         .replace(/ü/g, 'u')
         .replace(/ş/g, 's')
         .replace(/ı/g, 'i')
         .replace(/ö/g, 'o')
         .replace(/ç/g, 'c')
         .replace(/[^a-z0-9]+/g, '-')
         .replace(/^-+|-+$/g, '');
   }
   next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
