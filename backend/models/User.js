import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'İsim gereklidir'],
      trim: true
   },
   email: {
      type: String,
      required: [true, 'Email gereklidir'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Geçerli bir email adresi giriniz']
   },
   password: {
      type: String,
      required: [true, 'Şifre gereklidir'],
      minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
      select: false // Don't return password by default
   },
   role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
   },
   phone: {
      type: String,
      trim: true
   },
   address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'Türkiye' }
   },
   resetPasswordToken: String,
   resetPasswordExpire: Date
}, {
   timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
   if (!this.isModified('password')) {
      return next();
   }

   try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
   } catch (error) {
      next(error);
   }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
   return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function () {
   const user = this.toObject();
   delete user.password;
   return user;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
   // Generate token using crypto
   const crypto = require('crypto');
   const resetToken = crypto.randomBytes(32).toString('hex');

   // Hash token and set to resetPasswordToken field
   this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

   // Set expire time (1 hour)
   this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

   return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
