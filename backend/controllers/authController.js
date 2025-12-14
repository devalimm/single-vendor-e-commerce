import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({
            success: false,
            errors: errors.array()
         });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
         return res.status(400).json({
            success: false,
            message: 'Bu email adresi zaten kullanılıyor.'
         });
      }

      // Create user
      const user = await User.create({
         name,
         email,
         password
      });

      if (user) {
         res.status(201).json({
            success: true,
            data: {
               _id: user._id,
               name: user.name,
               email: user.email,
               role: user.role,
               token: generateToken(user._id)
            }
         });
      }
   } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
         success: false,
         message: 'Kayıt sırasında bir hata oluştu.'
      });
   }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
   try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
         return res.status(400).json({
            success: false,
            message: 'Email ve şifre gereklidir.'
         });
      }

      // Find user and include password
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
         return res.status(401).json({
            success: false,
            message: 'Geçersiz email veya şifre.'
         });
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
         return res.status(401).json({
            success: false,
            message: 'Geçersiz email veya şifre.'
         });
      }

      res.json({
         success: true,
         data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
         }
      });
   } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
         success: false,
         message: 'Giriş sırasında bir hata oluştu.'
      });
   }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
   try {
      const user = await User.findById(req.user._id);

      if (user) {
         res.json({
            success: true,
            data: user
         });
      } else {
         res.status(404).json({
            success: false,
            message: 'Kullanıcı bulunamadı.'
         });
      }
   } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
         success: false,
         message: 'Profil bilgileri alınırken hata oluştu.'
      });
   }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
   try {
      const user = await User.findById(req.user._id);

      if (user) {
         user.name = req.body.name || user.name;
         user.email = req.body.email || user.email;
         user.phone = req.body.phone || user.phone;

         if (req.body.address) {
            user.address = { ...user.address, ...req.body.address };
         }

         if (req.body.password) {
            user.password = req.body.password;
         }

         const updatedUser = await user.save();

         res.json({
            success: true,
            data: {
               _id: updatedUser._id,
               name: updatedUser.name,
               email: updatedUser.email,
               role: updatedUser.role,
               phone: updatedUser.phone,
               address: updatedUser.address,
               token: generateToken(updatedUser._id)
            }
         });
      } else {
         res.status(404).json({
            success: false,
            message: 'Kullanıcı bulunamadı.'
         });
      }
   } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
         success: false,
         message: 'Profil güncellenirken hata oluştu.'
      });
   }
};

// @desc    Forgot password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
   try {
      const { email } = req.body;

      if (!email) {
         return res.status(400).json({
            success: false,
            message: 'Email adresi gereklidir.'
         });
      }

      const user = await User.findOne({ email });

      // Don't reveal if user exists or not (security)
      if (!user) {
         return res.json({
            success: true,
            message: 'Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi.'
         });
      }

      // Get reset token
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      try {
         const { sendPasswordResetEmail } = await import('../utils/emailService.js');
         await sendPasswordResetEmail(user.email, resetUrl);

         res.json({
            success: true,
            message: 'Şifre sıfırlama linki email adresinize gönderildi.'
         });
      } catch (error) {
         console.error('Email send error:', error);
         user.resetPasswordToken = undefined;
         user.resetPasswordExpire = undefined;
         await user.save({ validateBeforeSave: false });

         return res.status(500).json({
            success: false,
            message: 'Email gönderilemedi. Lütfen daha sonra tekrar deneyin.'
         });
      }
   } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
         success: false,
         message: 'Bir hata oluştu.'
      });
   }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
   try {
      const { password } = req.body;

      if (!password) {
         return res.status(400).json({
            success: false,
            message: 'Yeni şifre gereklidir.'
         });
      }

      if (password.length < 6) {
         return res.status(400).json({
            success: false,
            message: 'Şifre en az 6 karakter olmalıdır.'
         });
      }

      // Hash token from URL
      const crypto = require('crypto');
      const resetPasswordToken = crypto
         .createHash('sha256')
         .update(req.params.token)
         .digest('hex');

      // Find user with valid token
      const user = await User.findOne({
         resetPasswordToken,
         resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
         return res.status(400).json({
            success: false,
            message: 'Geçersiz veya süresi dolmuş token.'
         });
      }

      // Set new password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({
         success: true,
         message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.',
         data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
         }
      });
   } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
         success: false,
         message: 'Şifre sıfırlanırken bir hata oluştu.'
      });
   }
};
