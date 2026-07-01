import Campaign from '../models/Campaign.js';
import { getActiveCampaigns } from '../utils/campaignHelper.js';

// @desc    Tüm kampanyaları getir (admin)
// @route   GET /api/campaigns
// @access  Admin
export const getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .populate('targetCategories', 'name')
            .populate('targetProducts', 'name')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            count: campaigns.length,
            data: campaigns
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Tek kampanya getir (admin)
// @route   GET /api/campaigns/:id
// @access  Admin
export const getCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('targetCategories', 'name')
            .populate('targetProducts', 'name');
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
        }
        res.json({ success: true, data: campaign });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Aktif kampanyaları getir (public — müşteri tarafı için)
// @route   GET /api/campaigns/active
// @access  Public
export const getPublicActiveCampaigns = async (req, res) => {
    try {
        const campaigns = await getActiveCampaigns();
        // Müşteriye sadece gerekli alanları gönder
        const publicData = campaigns.map(c => ({
            _id: c._id,
            name: c.name,
            type: c.type,
            buyQty: c.buyQty,
            payQty: c.payQty,
            conditionScope: c.conditionScope,
            targetCategories: c.targetCategories,
            targetProducts: c.targetProducts
        }));
        res.json({ success: true, data: publicData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Yeni kampanya oluştur
// @route   POST /api/campaigns
// @access  Admin
export const createCampaign = async (req, res) => {
    try {
        const {
            name, type, buyQty, payQty,
            conditionScope, targetCategories, targetProducts,
            startDate, endDate, isActive
        } = req.body;

        // Temel validasyon
        if (!name || !buyQty || !payQty || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Lütfen zorunlu alanları doldurun: ad, alınacak adet, ödenecek adet, tarihler'
            });
        }

        const bQty = parseInt(buyQty);
        const pQty = parseInt(payQty);

        if (!Number.isInteger(bQty) || bQty < 2) {
            return res.status(400).json({ success: false, message: 'Alınması gereken adet en az 2 olmalıdır' });
        }
        if (!Number.isInteger(pQty) || pQty < 1) {
            return res.status(400).json({ success: false, message: 'Ödenecek adet en az 1 olmalıdır' });
        }
        if (pQty >= bQty) {
            return res.status(400).json({ success: false, message: 'Ödenecek adet, alınması gereken adetten küçük olmalıdır' });
        }
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ success: false, message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır' });
        }

        const scope = conditionScope || 'all_products';

        const campaign = await Campaign.create({
            name,
            type: type || 'buy_x_get_y',
            buyQty: bQty,
            payQty: pQty,
            conditionScope: scope,
            targetCategories: scope === 'specific_category' ? (targetCategories || []) : [],
            targetProducts: scope === 'specific_products' ? (targetProducts || []) : [],
            startDate,
            endDate,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({ success: true, data: campaign });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Kampanya güncelle
// @route   PUT /api/campaigns/:id
// @access  Admin
export const updateCampaign = async (req, res) => {
    try {
        const body = { ...req.body };

        // buyQty/payQty integer dönüşümü
        if (body.buyQty !== undefined) body.buyQty = parseInt(body.buyQty);
        if (body.payQty !== undefined) body.payQty = parseInt(body.payQty);

        // Kapsam değişince ilgili hedefleri temizle
        if (body.conditionScope === 'all_products') {
            body.targetCategories = [];
            body.targetProducts = [];
        } else if (body.conditionScope === 'specific_category') {
            body.targetProducts = [];
        } else if (body.conditionScope === 'specific_products') {
            body.targetCategories = [];
        }

        const campaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            body,
            { new: true, runValidators: true }
        )
            .populate('targetCategories', 'name')
            .populate('targetProducts', 'name');

        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
        }

        res.json({ success: true, data: campaign });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};

// @desc    Kampanya sil
// @route   DELETE /api/campaigns/:id
// @access  Admin
export const deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndDelete(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
        }
        res.json({ success: true, message: 'Kampanya silindi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası', error: error.message });
    }
};
