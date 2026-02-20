import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import discountRoutes from './routes/discounts.js';
import variationRoutes from './routes/variations.js';

// Import rate limiters
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Trust proxy - required for rate limiting behind Render/cloud proxies
app.set('trust proxy', 1);

connectDB();

// Middleware
const allowedOrigins = [
   'http://localhost:5173',
   process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
   origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
         callback(null, true);
      } else {
         callback(new Error('Not allowed by CORS'));
      }
   },
   credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api', (req, res) => {
   res.json({
      message: 'Asiye Özel E-commerce API',
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
   });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
   res.json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime()
   });
});

// API Routes
// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

// Apply stricter rate limiter to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/variations', variationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
   });
});

// 404 handler
app.use((req, res) => {
   res.status(404).json({
      success: false,
      message: 'Route not found'
   });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
   console.log(`Server running on port ${PORT}`);
   console.log(`Environment: ${process.env.NODE_ENV}`);
   console.log(`API available at http://localhost:${PORT}/api`);
});
