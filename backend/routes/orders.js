import express from 'express';
import {
   createOrder,
   getUserOrders,
   getOrder,
   getAllOrders,
   updateOrderStatus,
   updatePaymentStatus
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

// Protected routes (user must be logged in)
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getUserOrders);
router.get('/:id', protect, getOrder);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/payment', protect, adminOnly, updatePaymentStatus);

export default router;
