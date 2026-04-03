import express from 'express';
import { getReportSummary, getCategoryReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

router.get('/summary', protect, adminOnly, getReportSummary);
router.get('/categories', protect, adminOnly, getCategoryReport);

export default router;
