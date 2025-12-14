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

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
   origin: 'http://localhost:5173', // Vite default port
   credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route for testing
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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);

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
   console.log(`Static files served from /uploads`);
});
