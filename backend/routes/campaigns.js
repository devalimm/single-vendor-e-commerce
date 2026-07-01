import express from 'express';
import {
    getAllCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getPublicActiveCampaigns
} from '../controllers/campaignController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

// Public: aktif kampanyaları getir (müşteri tarafı)
router.get('/active', getPublicActiveCampaigns);

// Admin korumalı CRUD
router.get('/', protect, adminOnly, getAllCampaigns);
router.post('/', protect, adminOnly, createCampaign);
router.get('/:id', protect, adminOnly, getCampaign);
router.put('/:id', protect, adminOnly, updateCampaign);
router.delete('/:id', protect, adminOnly, deleteCampaign);

export default router;
