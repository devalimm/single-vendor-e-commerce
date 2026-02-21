import express from 'express';
import { getShippingSettings, updateShippingSettings } from '../controllers/shippingController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

// Public — checkout needs this
router.get('/', getShippingSettings);

// Admin only
router.put('/', protect, adminOnly, updateShippingSettings);

export default router;
