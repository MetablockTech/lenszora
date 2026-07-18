import mongoose from 'mongoose';

const pincodeSchema = new mongoose.Schema({
    pincode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    isServiceable: {
        type: Boolean,
        default: true
    },
    estimatedDeliveryDays: {
        type: Number,
        default: 7,
        min: 1
    },
    deliveryRules: [{
        minOrderValue: { type: Number, required: true },
        deliveryCharge: { type: Number, required: true }
    }]
}, {
    timestamps: true
});

export const Pincode = mongoose.model('Pincode', pincodeSchema);
