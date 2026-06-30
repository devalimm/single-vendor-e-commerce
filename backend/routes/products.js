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
   deleteImage,
   getAdminProducts,
   getAdminProduct,
   getRelatedProducts
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { upload, handleUploadError, processImages } from '../middleware/upload.js';

const router = express.Router();

// Public routes - order matters! Specific routes before :id
router.get('/new', getNewProducts);
router.get('/bestselling', getBestSelling);
router.get('/category/:categoryId', getByCategory);
router.get('/related/:productId', getRelatedProducts);
router.get('/', getAllProducts);

// Admin routes — MUST come before /:id to prevent "admin" being matched as a product ID
router.get('/admin/all', protect, adminOnly, getAdminProducts);
router.get('/admin/:id', protect, adminOnly, getAdminProduct);

// Public single product — comes AFTER all static admin routes
router.get('/:id', getProduct);

// Admin mutate routes
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
