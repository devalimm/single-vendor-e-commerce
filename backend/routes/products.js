import express from 'express';
import {
   getAllProducts,
   getNewProducts,
   getBestSelling,
   getByCategory,
   getProduct,
   createProduct,
   updateProduct,
   deleteProduct,
   uploadImages,
   deleteImage
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { upload, handleUploadError, processImages } from '../middleware/upload.js';

const router = express.Router();

// Public routes - order matters! Specific routes before :id
router.get('/new', getNewProducts);
router.get('/bestselling', getBestSelling);
router.get('/category/:categoryId', getByCategory);
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Image upload routes
router.post(
   '/:id/images',
   protect,
   adminOnly,
   upload.array('images', 10), // Max 10 images
   handleUploadError,
   processImages,
   uploadImages
);

router.delete('/:id/images/:imagePath', protect, adminOnly, deleteImage);

export default router;
