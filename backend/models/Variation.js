import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Varyasyon adı gereklidir'],
        trim: true,
        unique: true
    },
    options: [{
        name: { type: String, required: true, trim: true },
        extraPrice: { type: Number, default: 0, min: 0 }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Variation = mongoose.model('Variation', variationSchema);

export default Variation;
