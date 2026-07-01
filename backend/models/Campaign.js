import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Kampanya adı gereklidir'],
        trim: true
    },
    // Şimdilik sadece 'buy_x_get_y' destekleniyor, genişletilebilir
    type: {
        type: String,
        enum: ['buy_x_get_y'],
        required: [true, 'Kampanya tipi gereklidir'],
        default: 'buy_x_get_y'
    },
    // Alınması gereken adet (örn. 3 al)
    buyQty: {
        type: Number,
        required: [true, 'Alınması gereken adet gereklidir'],
        min: [2, 'Alınması gereken adet en az 2 olmalıdır'],
        validate: {
            validator: Number.isInteger,
            message: 'Alınması gereken adet tam sayı olmalıdır'
        }
    },
    // Ödenecek adet (örn. 2 öde)
    payQty: {
        type: Number,
        required: [true, 'Ödenecek adet gereklidir'],
        min: [1, 'Ödenecek adet en az 1 olmalıdır'],
        validate: {
            validator: Number.isInteger,
            message: 'Ödenecek adet tam sayı olmalıdır'
        }
    },
    // Kapsam: hangi ürünler için geçerli
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
    startDate: {
        type: Date,
        required: [true, 'Başlangıç tarihi gereklidir']
    },
    endDate: {
        type: Date,
        required: [true, 'Bitiş tarihi gereklidir']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// payQty < buyQty validasyonu
campaignSchema.pre('validate', function (next) {
    if (this.payQty >= this.buyQty) {
        this.invalidate('payQty', 'Ödenecek adet, alınması gereken adetten küçük olmalıdır');
    }
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
        this.invalidate('endDate', 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır');
    }
    next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
