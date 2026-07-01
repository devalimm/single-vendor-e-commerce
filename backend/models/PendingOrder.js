import mongoose from 'mongoose';

const pendingOrderSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: String,
        productImage: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        size: String,
        length: String,
        variationSelections: [{
            variationName: String,
            optionName: String
        }],
        selectedOptions: [{
            name: String,
            price: Number
        }],
        basePrice: Number,
        variationExtraTotal: Number,
        lengthAdjustment: Number,
        optionsTotal: Number,
        discountApplied: mongoose.Schema.Types.Mixed,
        itemTotal: Number
    }],
    shippingAddress: {
        fullName: String,
        tcKimlik: String,
        email: String,
        phone: String,
        city: String,
        district: String,
        neighborhood: String,
        address: String
    },
    subtotal: Number,
    shippingCost: Number,
    tax: Number,
    total: Number,
    customerNote: String,
    // Uygulanan kampanya indirimleri (iyzico callback'te Order'a taşınır)
    campaignDiscounts: [{
        campaignId: mongoose.Schema.Types.ObjectId,
        campaignName: String,
        discountAmount: Number
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    iyzicoToken: String,
    // Auto-delete after 2 hours
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 7200
    }
});

const PendingOrder = mongoose.model('PendingOrder', pendingOrderSchema);

export default PendingOrder;
