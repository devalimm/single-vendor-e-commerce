import Discount from '../models/Discount.js';

// @desc    Tüm indirimleri getir (admin)
// @route   GET /api/discounts
// @access  Admin
export const getAllDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find()
            .populate('targetCategories', 'name')
            .populate('targetProducts', 'name')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            count: discounts.length,
            data: discounts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Tek indirim getir
// @route   GET /api/discounts/:id
// @access  Admin
export const getDiscount = async (req, res) => {
    try {
        const discount = await Discount.findById(req.params.id)
            .populate('targetCategories', 'name')
            .populate('targetProducts', 'name');
        if (!discount) {
            return res.status(404).json({ success: false, message: 'İndirim bulunamadı' });
        }
        res.json({ success: true, data: discount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Yeni indirim oluştur
// @route   POST /api/discounts
// @access  Admin
export const createDiscount = async (req, res) => {
    try {
        const {
            name, method, type, currency, conditionScope,
            condition, conditionValue, value, startDate, endDate, isActive,
            targetCategories, targetProducts
        } = req.body;

        // Temel validasyon
        if (!name || !method || !type || !value || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen zorunlu alanları doldurun: ad, yöntem, tip, değer, başlangıç ve bitiş tarihleri'
            });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
            });
        }

        const discount = await Discount.create({
            name, method, type,
            currency: currency || 'TRY',
            conditionScope: conditionScope || 'all_products',
            targetCategories: conditionScope === 'specific_category' ? (targetCategories || []) : [],
            targetProducts: conditionScope === 'specific_products' ? (targetProducts || []) : [],
            condition: condition || 'min_cart_amount',
            conditionValue: conditionValue || 0,
            value, startDate, endDate,
            isActive: isActive || false
        });

        res.status(201).json({ success: true, data: discount });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    İndirim güncelle
// @route   PUT /api/discounts/:id
// @access  Admin
export const updateDiscount = async (req, res) => {
    try {
        // conditionScope değişince ilgili olmayan hedefleri temizle
        if (req.body.conditionScope === 'all_products') {
            req.body.targetCategories = [];
            req.body.targetProducts = [];
        } else if (req.body.conditionScope === 'specific_category') {
            req.body.targetProducts = [];
        } else if (req.body.conditionScope === 'specific_products') {
            req.body.targetCategories = [];
        }

        const discount = await Discount.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('targetCategories', 'name')
            .populate('targetProducts', 'name');

        if (!discount) {
            return res.status(404).json({ success: false, message: 'İndirim bulunamadı' });
        }

        res.json({ success: true, data: discount });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    İndirim sil
// @route   DELETE /api/discounts/:id
// @access  Admin
export const deleteDiscount = async (req, res) => {
    try {
        const discount = await Discount.findByIdAndDelete(req.params.id);

        if (!discount) {
            return res.status(404).json({ success: false, message: 'İndirim bulunamadı' });
        }

        res.json({ success: true, message: 'İndirim silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};
