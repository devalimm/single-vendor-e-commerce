import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/products'));
   },
   filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
   }
});

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
      fileSize: 5 * 1024 * 1024 // 5MB max file size
   }
});

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
   if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
         return res.status(400).json({
            success: false,
            message: 'Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.'
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
