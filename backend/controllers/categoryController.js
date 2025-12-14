import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
   try {
      const categories = await Category.find({ isActive: true }).sort({ name: 1 });

      res.json({
         success: true,
         count: categories.length,
         data: categories
      });
   } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
         success: false,
         message: 'Kategoriler alınırken hata oluştu.'
      });
   }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
   try {
      const category = await Category.findById(req.params.id);

      if (!category) {
         return res.status(404).json({
            success: false,
            message: 'Kategori bulunamadı.'
         });
      }

      res.json({
         success: true,
         data: category
      });
   } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({
         success: false,
         message: 'Kategori alınırken hata oluştu.'
      });
   }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
   try {
      const { name, description, image } = req.body;

      if (!name) {
         return res.status(400).json({
            success: false,
            message: 'Kategori adı gereklidir.'
         });
      }

      const category = await Category.create({
         name,
         description,
         image
      });

      res.status(201).json({
         success: true,
         data: category
      });
   } catch (error) {
      console.error('Create category error:', error);

      if (error.code === 11000) {
         return res.status(400).json({
            success: false,
            message: 'Bu kategori adı zaten kullanılıyor.'
         });
      }

      res.status(500).json({
         success: false,
         message: 'Kategori oluşturulurken hata oluştu.'
      });
   }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
   try {
      const category = await Category.findById(req.params.id);

      if (!category) {
         return res.status(404).json({
            success: false,
            message: 'Kategori bulunamadı.'
         });
      }

      const { name, description, image, isActive } = req.body;

      if (name) category.name = name;
      if (description !== undefined) category.description = description;
      if (image !== undefined) category.image = image;
      if (isActive !== undefined) category.isActive = isActive;

      const updatedCategory = await category.save();

      res.json({
         success: true,
         data: updatedCategory
      });
   } catch (error) {
      console.error('Update category error:', error);

      if (error.code === 11000) {
         return res.status(400).json({
            success: false,
            message: 'Bu kategori adı zaten kullanılıyor.'
         });
      }

      res.status(500).json({
         success: false,
         message: 'Kategori güncellenirken hata oluştu.'
      });
   }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
   try {
      const category = await Category.findById(req.params.id);

      if (!category) {
         return res.status(404).json({
            success: false,
            message: 'Kategori bulunamadı.'
         });
      }

      await category.deleteOne();

      res.json({
         success: true,
         message: 'Kategori silindi.'
      });
   } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
         success: false,
         message: 'Kategori silinirken hata oluştu.'
      });
   }
};
