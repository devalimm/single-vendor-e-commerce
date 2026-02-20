import Variation from '../models/Variation.js';

// @desc    Tüm varyasyonları getir
// @route   GET /api/variations
// @access  Admin
export const getAllVariations = async (req, res) => {
    try {
        const variations = await Variation.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: variations.length,
            data: variations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Tek varyasyon getir
// @route   GET /api/variations/:id
// @access  Admin
export const getVariation = async (req, res) => {
    try {
        const variation = await Variation.findById(req.params.id);
        if (!variation) {
            return res.status(404).json({ success: false, message: 'Varyasyon bulunamadı' });
        }
        res.json({ success: true, data: variation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Yeni varyasyon oluştur
// @route   POST /api/variations
// @access  Admin
export const createVariation = async (req, res) => {
    try {
        const { name, options, isActive } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Varyasyon adı gereklidir'
            });
        }

        if (!options || options.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'En az bir seçenek eklenmelidir'
            });
        }

        const variation = await Variation.create({
            name,
            options,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({ success: true, data: variation });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bu varyasyon adı zaten kullanılıyor'
            });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Varyasyon güncelle
// @route   PUT /api/variations/:id
// @access  Admin
export const updateVariation = async (req, res) => {
    try {
        const variation = await Variation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!variation) {
            return res.status(404).json({ success: false, message: 'Varyasyon bulunamadı' });
        }

        res.json({ success: true, data: variation });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bu varyasyon adı zaten kullanılıyor'
            });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Varyasyon sil
// @route   DELETE /api/variations/:id
// @access  Admin
export const deleteVariation = async (req, res) => {
    try {
        const variation = await Variation.findByIdAndDelete(req.params.id);

        if (!variation) {
            return res.status(404).json({ success: false, message: 'Varyasyon bulunamadı' });
        }

        res.json({ success: true, message: 'Varyasyon silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};
