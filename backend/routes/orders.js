import express from 'express';
import {
   createGuestOrder,
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

// Public route (guest checkout)
router.post('/guest', createGuestOrder);

// Admin routes - MUST come before /:id to prevent "admin" being matched as an ID
router.get('/admin/all', protect, adminOnly, getAllOrders);

// Protected routes (user must be logged in)
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getUserOrders);

// Status and payment updates - must come before /:id
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/payment', protect, adminOnly, updatePaymentStatus);

// Single order route - must be LAST (catches any :id)
router.get('/:id', protect, getOrder);

export default router;
