import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads/products');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
   fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage - we'll process with Sharp before saving
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|jpe|jfif|png|gif|webp/;
   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
   const mimetype = allowedTypes.test(file.mimetype);

   if (extname && mimetype) {
      cb(null, true);
   } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir (jpeg, jpg, jfif, png, gif, webp)'));
   }
};

// Multer upload configuration
export const upload = multer({
   storage: storage,
   fileFilter: fileFilter,
   limits: {
      fileSize: 10 * 1024 * 1024 // 10MB max (before optimization)
   }
});

// Process and optimize images with Sharp
export const processImages = async (req, res, next) => {
   try {
      if (!req.files || req.files.length === 0) {
         return next();
      }

      const processedFiles = [];

      for (const file of req.files) {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         const filename = `product-${uniqueSuffix}.webp`;
         const filepath = path.join(uploadsDir, filename);

         // Process image with Sharp
         await sharp(file.buffer)
            .resize(1920, 1920, {
               fit: 'inside',
               withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(filepath);

         processedFiles.push({
            filename: filename,
            path: `/uploads/products/${filename}`,
            mimetype: 'image/webp'
         });
      }

      // Replace req.files with processed file info
      req.processedFiles = processedFiles;
      next();
   } catch (error) {
      console.error('Image processing error:', error);
      return res.status(500).json({
         success: false,
         message: 'Görsel işlenirken hata oluştu.'
      });
   }
};

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
   if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
         return res.status(400).json({
            success: false,
            message: 'Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.'
         });
      }
      return res.status(400).json({
         success: false,
         message: 'Dosya yükleme hatası: ' + err.message
      });
   } else if (err) {
      return res.status(400).json({
         success: false,
         message: err.message
      });
   }
   next();
};
