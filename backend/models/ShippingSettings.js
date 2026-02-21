import mongoose from 'mongoose';

const shippingSettingsSchema = new mongoose.Schema({
    // Standart kargolama ücreti
    standardShippingFee: {
        type: Number,
        default: 30,
        min: 0
    },

    // Standart Kargo Ücreti, Ücretsiz Kargo'lu ürünlerim için de geçerli olsun
    applyToFreeShippingProducts: {
        type: Boolean,
        default: false
    },

    // Kargo ücreti hesaplama yöntemi
    calculationMethod: {
        type: String,
        enum: [
            'single',      // Sepetin toplamı için tek bir ürünün kargo ücretini uygula
            'sum_all',     // Sepetteki tüm ürünlerin kargo ücretlerini toplayarak uygula
            'first_plus',  // Sepetteki ilk ürünün kargo ücreti üzerine ürün başına ücret ekle
            'threshold',   // Sepetin toplamını eşik değere karşılaştırarak kargo ücreti belirle
            'delivery'     // Müşterinin seçeceği teslimat yöntemine göre ücret belirle
        ],
        default: 'single'
    },

    // İlk ürünün kargo ücreti üzerine ek ürün başına ücret (first_plus yöntemi için)
    perItemExtraFee: {
        type: Number,
        default: 0,
        min: 0
    },

    // Ücretsiz kargo opsiyonu
    freeShippingEnabled: {
        type: Boolean,
        default: true
    },

    // Ücretsiz kargo için minimum sipariş tutarı
    freeShippingThreshold: {
        type: Number,
        default: 500,
        min: 0
    }
}, {
    timestamps: true
});

// Singleton pattern — only one settings document
shippingSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const ShippingSettings = mongoose.model('ShippingSettings', shippingSettingsSchema);

export default ShippingSettings;
