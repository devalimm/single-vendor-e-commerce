import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Opsiyon adı gereklidir'],
        trim: true,
        unique: true
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Option = mongoose.model('Option', optionSchema);

export default Option;
