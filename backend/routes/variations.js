import express from 'express';
import {
    getAllVariations,
    getVariation,
    createVariation,
    updateVariation,
    deleteVariation
} from '../controllers/variationController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

// All routes require admin access
router.use(protect, adminOnly);

router.route('/')
    .get(getAllVariations)
    .post(createVariation);

router.route('/:id')
    .get(getVariation)
    .put(updateVariation)
    .delete(deleteVariation);

export default router;
