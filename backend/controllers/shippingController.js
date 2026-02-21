import ShippingSettings from '../models/ShippingSettings.js';

// @desc    Get shipping settings
// @route   GET /api/shipping-settings
// @access  Public (needed by checkout)
export const getShippingSettings = async (req, res) => {
    try {
        const settings = await ShippingSettings.getSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Get shipping settings error:', error);
        res.status(500).json({ success: false, message: 'Kargo ayarları alınamadı.' });
    }
};

// @desc    Update shipping settings
// @route   PUT /api/shipping-settings
// @access  Admin
export const updateShippingSettings = async (req, res) => {
    try {
        const {
            standardShippingFee,
            applyToFreeShippingProducts,
            calculationMethod,
            perItemExtraFee,
            freeShippingEnabled,
            freeShippingThreshold
        } = req.body;

        let settings = await ShippingSettings.getSettings();

        if (standardShippingFee !== undefined) settings.standardShippingFee = standardShippingFee;
        if (applyToFreeShippingProducts !== undefined) settings.applyToFreeShippingProducts = applyToFreeShippingProducts;
        if (calculationMethod !== undefined) settings.calculationMethod = calculationMethod;
        if (perItemExtraFee !== undefined) settings.perItemExtraFee = perItemExtraFee;
        if (freeShippingEnabled !== undefined) settings.freeShippingEnabled = freeShippingEnabled;
        if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = freeShippingThreshold;

        await settings.save();

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Update shipping settings error:', error);
        res.status(500).json({ success: false, message: 'Kargo ayarları güncellenemedi.' });
    }
};
