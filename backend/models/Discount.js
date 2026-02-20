import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'İndirim adı gereklidir'],
        trim: true
    },
    // 'coupon_code' | 'automatic'
    method: {
        type: String,
        enum: ['coupon_code', 'automatic'],
        required: [true, 'İndirim yöntemi gereklidir']
    },
    // 'percentage' | 'fixed_amount'
    type: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        required: [true, 'İndirim tipi gereklidir']
    },
    currency: {
        type: String,
        default: 'TRY'
    },
    // Koşul kapsamı: hangi ürünler için geçerli
    conditionScope: {
        type: String,
        enum: ['all_products', 'specific_category', 'specific_products'],
        default: 'all_products'
    },
    // Seçili kategoriler (conditionScope === 'specific_category' ise)
    targetCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    // Seçili ürünler (conditionScope === 'specific_products' ise)
    targetProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    // Koşul türü
    condition: {
        type: String,
        enum: ['min_cart_amount', 'no_condition'],
        default: 'min_cart_amount'
    },
    // Koşul değeri (ör. minimum alışveriş tutarı)
    conditionValue: {
        type: Number,
        default: 0,
        min: 0
    },
    // İndirim değeri (yüzde veya sabit tutar)
    value: {
        type: Number,
        required: [true, 'İndirim değeri gereklidir'],
        min: [0, 'İndirim değeri negatif olamaz']
    },
    startDate: {
        type: Date,
        required: [true, 'Geçerlilik başlangıç tarihi gereklidir']
    },
    endDate: {
        type: Date,
        required: [true, 'Geçerlilik bitiş tarihi gereklidir']
    },
    // Aktif/Pasif durumu
    isActive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Discount = mongoose.model('Discount', discountSchema);

export default Discount;
