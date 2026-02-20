import express from 'express';
import {
    getAllDiscounts,
    getDiscount,
    createDiscount,
    updateDiscount,
    deleteDiscount
} from '../controllers/discountController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

// Tüm discount route'ları admin korumalı
router.get('/', protect, adminOnly, getAllDiscounts);
router.post('/', protect, adminOnly, createDiscount);
router.get('/:id', protect, adminOnly, getDiscount);
router.put('/:id', protect, adminOnly, updateDiscount);
router.delete('/:id', protect, adminOnly, deleteDiscount);

export default router;
