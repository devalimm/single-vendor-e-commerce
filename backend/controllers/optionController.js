import Option from '../models/Option.js';

// @desc    Tüm opsiyonları getir
// @route   GET /api/options
// @access  Admin
export const getAllOptions = async (req, res) => {
    try {
        const options = await Option.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: options.length,
            data: options
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Yeni opsiyon oluştur
// @route   POST /api/options
// @access  Admin
export const createOption = async (req, res) => {
    try {
        const { name, price, isActive } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Opsiyon adı gereklidir'
            });
        }

        const option = await Option.create({
            name,
            price: price || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({ success: true, data: option });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bu opsiyon adı zaten kullanılıyor'
            });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Opsiyon güncelle
// @route   PUT /api/options/:id
// @access  Admin
export const updateOption = async (req, res) => {
    try {
        const option = await Option.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!option) {
            return res.status(404).json({ success: false, message: 'Opsiyon bulunamadı' });
        }

        res.json({ success: true, data: option });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bu opsiyon adı zaten kullanılıyor'
            });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Opsiyon sil
// @route   DELETE /api/options/:id
// @access  Admin
export const deleteOption = async (req, res) => {
    try {
        const option = await Option.findByIdAndDelete(req.params.id);

        if (!option) {
            return res.status(404).json({ success: false, message: 'Opsiyon bulunamadı' });
        }

        res.json({ success: true, message: 'Opsiyon silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};
