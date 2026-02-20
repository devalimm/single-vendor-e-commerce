import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Varyasyon adı gereklidir'],
        trim: true,
        unique: true
    },
    options: [{
        type: String,
        trim: true
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
