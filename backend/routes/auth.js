import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, updateProfile, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
   body('name').trim().notEmpty().withMessage('İsim gereklidir'),
   body('phone').trim().notEmpty().withMessage('Telefon numarası gereklidir'),
   body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
];

const loginValidation = [
   body('phone').trim().notEmpty().withMessage('Telefon numarası gereklidir'),
   body('password').notEmpty().withMessage('Şifre gereklidir')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;

