import Product from '../models/Product.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;

      // Build query
      const query = { isActive: true };

      // Filter by category
      if (req.query.category) {
         query.category = req.query.category;
      }

      // Filter by featured
      if (req.query.featured === 'true') {
         query.isFeatured = true;
      }

      // Filter by new
      if (req.query.new === 'true') {
         query.isNew = true;
      }

      // Search by name
      if (req.query.search) {
         query.name = { $regex: req.query.search, $options: 'i' };
      }

      // Sorting
      let sort = {};
      if (req.query.sort === 'price-asc') {
         sort.basePrice = 1;
      } else if (req.query.sort === 'price-desc') {
         sort.basePrice = -1;
      } else if (req.query.sort === 'newest') {
         sort.createdAt = -1;
      } else if (req.query.sort === 'bestselling') {
         sort.salesCount = -1;
      } else {
         sort.createdAt = -1; // Default: newest first
      }

      const products = await Product.find(query)
         .populate('category', 'name slug')
         .sort(sort)
         .limit(limit)
         .skip(skip);

      const total = await Product.countDocuments(query);

      res.json({
         success: true,
         count: products.length,
         total,
         page,
         pages: Math.ceil(total / limit),
         data: products
      });
   } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
         success: false,
         message: 'Ürünler alınırken hata oluştu.'
      });
   }
};

// @desc    Get new products
// @route   GET /api/products/new
// @access  Public
export const getNewProducts = async (req, res) => {
   try {
      const limit = parseInt(req.query.limit) || 8;

      const products = await Product.find({ isActive: true, isNew: true })
         .populate('category', 'name slug')
         .sort({ createdAt: -1 })
         .limit(limit);

      res.json({
         success: true,
         count: products.length,
         data: products
      });
   } catch (error) {
      console.error('Get new products error:', error);
      res.status(500).json({
         success: false,
         message: 'Yeni ürünler alınırken hata oluştu.'
      });
   }
};

// @desc    Get best selling products
// @route   GET /api/products/bestselling
// @access  Public
export const getBestSelling = async (req, res) => {
   try {
      const limit = parseInt(req.query.limit) || 8;

      const products = await Product.find({ isActive: true })
         .populate('category', 'name slug')
         .sort({ salesCount: -1 })
         .limit(limit);

      res.json({
         success: true,
         count: products.length,
         data: products
      });
   } catch (error) {
      console.error('Get bestselling products error:', error);
      res.status(500).json({
         success: false,
         message: 'Çok satan ürünler alınırken hata oluştu.'
      });
   }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
export const getByCategory = async (req, res) => {
   try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const skip = (page - 1) * limit;

      const products = await Product.find({
         category: req.params.categoryId,
         isActive: true
      })
         .populate('category', 'name slug')
         .sort({ createdAt: -1 })
         .limit(limit)
         .skip(skip);

      const total = await Product.countDocuments({
         category: req.params.categoryId,
         isActive: true
      });

      res.json({
         success: true,
         count: products.length,
         total,
         page,
         pages: Math.ceil(total / limit),
         data: products
      });
   } catch (error) {
      console.error('Get products by category error:', error);
      res.status(500).json({
         success: false,
         message: 'Kategoriye göre ürünler alınırken hata oluştu.'
      });
   }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id)
         .populate('category', 'name slug description');

      if (!product) {
         return res.status(404).json({
            success: false,
            message: 'Ürün bulunamadı.'
         });
      }

      // Increment view count
      product.viewCount += 1;
      await product.save();

      res.json({
         success: true,
         data: product
      });
   } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
         success: false,
         message: 'Ürün alınırken hata oluştu.'
      });
   }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
   try {
      const {
         name,
         description,
         basePrice,
         category,
         sku,
         sizes,
         lengths,
         options,
         tags,
         isFeatured,
         isNew
      } = req.body;

      // Validation
      if (!name || !basePrice || !category) {
         return res.status(400).json({
            success: false,
            message: 'Ürün adı, fiyat ve kategori gereklidir.'
         });
      }

      const product = await Product.create({
         name,
         description: description || '',
         basePrice,
         category,
         sku: sku || '',
         sizes: sizes || [],
         lengths: lengths || [],
         options: options || [],
         tags: tags || [],
         isFeatured: isFeatured || false,
         isNew: isNew !== undefined ? isNew : true
      });

      const populatedProduct = await Product.findById(product._id)
         .populate('category', 'name slug');

      res.status(201).json({
         success: true,
         data: populatedProduct
      });
   } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
         success: false,
         message: 'Ürün oluşturulurken hata oluştu.',
         error: error.message
      });
   }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({
            success: false,
            message: 'Ürün bulunamadı.'
         });
      }

      const {
         name,
         description,
         basePrice,
         category,
         sku,
         sizes,
         lengths,
         options,
         tags,
         isActive,
         isFeatured,
         isNew
      } = req.body;

      // Update fields
      if (name) product.name = name;
      if (description) product.description = description;
      if (basePrice !== undefined) product.basePrice = basePrice;
      if (category) product.category = category;
      if (sku !== undefined) product.sku = sku;
      if (sizes) product.sizes = sizes;
      if (lengths) product.lengths = lengths;
      if (options) product.options = options;
      if (tags) product.tags = tags;
      if (isActive !== undefined) product.isActive = isActive;
      if (isFeatured !== undefined) product.isFeatured = isFeatured;
      if (isNew !== undefined) product.isNew = isNew;

      const updatedProduct = await product.save();
      const populatedProduct = await Product.findById(updatedProduct._id)
         .populate('category', 'name slug');

      res.json({
         success: true,
         data: populatedProduct
      });
   } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
         success: false,
         message: 'Ürün güncellenirken hata oluştu.'
      });
   }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({
            success: false,
            message: 'Ürün bulunamadı.'
         });
      }

      // Delete product images
      if (product.images && product.images.length > 0) {
         product.images.forEach(imagePath => {
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
               fs.unlinkSync(fullPath);
            }
         });
      }

      await product.deleteOne();

      res.json({
         success: true,
         message: 'Ürün silindi.'
      });
   } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
         success: false,
         message: 'Ürün silinirken hata oluştu.'
      });
   }
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Admin
export const uploadImages = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({
            success: false,
            message: 'Ürün bulunamadı.'
         });
      }

      if (!req.files || req.files.length === 0) {
         return res.status(400).json({
            success: false,
            message: 'Lütfen en az bir resim yükleyin.'
         });
      }

      // Add new images to product
      const imagePaths = req.files.map(file => `/uploads/products/${file.filename}`);
      product.images.push(...imagePaths);

      await product.save();

      res.json({
         success: true,
         data: product
      });
   } catch (error) {
      console.error('Upload images error:', error);
      res.status(500).json({
         success: false,
         message: 'Resimler yüklenirken hata oluştu.'
      });
   }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imagePath
// @access  Private/Admin
export const deleteImage = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({
            success: false,
            message: 'Ürün bulunamadı.'
         });
      }

      const imagePath = decodeURIComponent(req.params.imagePath);
      const imageIndex = product.images.indexOf(imagePath);

      if (imageIndex === -1) {
         return res.status(404).json({
            success: false,
            message: 'Resim bulunamadı.'
         });
      }

      // Delete file from filesystem
      const fullPath = path.join(__dirname, '..', imagePath);
      if (fs.existsSync(fullPath)) {
         fs.unlinkSync(fullPath);
      }

      // Remove from product
      product.images.splice(imageIndex, 1);
      await product.save();

      res.json({
         success: true,
         message: 'Resim silindi.',
         data: product
      });
   } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({
         success: false,
         message: 'Resim silinirken hata oluştu.'
      });
   }
};
