import express from 'express';
import {
    getAllOptions,
    createOption,
    updateOption,
    deleteOption
} from '../controllers/optionController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();

router.route('/')
    .get(protect, adminOnly, getAllOptions)
    .post(protect, adminOnly, createOption);

router.route('/:id')
    .put(protect, adminOnly, updateOption)
    .delete(protect, adminOnly, deleteOption);

export default router;
