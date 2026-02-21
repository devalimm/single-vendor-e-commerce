import express from 'express';
import { getCustomers, getCustomer } from '../controllers/customerController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

// All routes require admin access
router.get('/', protect, adminOnly, getCustomers);
router.get('/:id', protect, adminOnly, getCustomer);

export default router;
