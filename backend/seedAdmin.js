import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '.env') });

const createAdminUser = async () => {
   try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB Connected');

      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: 'admin@asiyeozel.com' });

      if (existingAdmin) {
         console.log('⚠️  Admin user already exists');
         process.exit(0);
      }

      // Create admin user
      const admin = await User.create({
         name: 'Admin',
         phone: '05555555555',
         password: 'admin123',
         role: 'admin'
      });

      console.log('✅ Admin user created successfully');
      console.log('📧 Phone: 05555555555');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the password after first login!');

      process.exit(0);
   } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
   }
};

createAdminUser();
