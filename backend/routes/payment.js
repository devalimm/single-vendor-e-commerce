import express from 'express';
import {
    initializeCheckoutForm
} from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Initialize checkout form (called by frontend)
router.post('/initialize', optionalAuth, initializeCheckoutForm);


// Note: callback route is registered directly in server.js (before CORS middleware)

export default router;
