import mongoose from 'mongoose';

// Updated Payment Details Schema and Payment Route
const paymentDetailsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    planId: {
        type: String,
        required: true,
        enum: ['Basic-monthly', 'Basic-Yearly', 'Pro-monthly', 'Pro-Yearly', 'Enterprise-monthly', 'Enterprise-Yearly'],
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'successful', 'failed'],
        default: 'pending',
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    validityEndDate: {
        type: Date,
    },
});

const PaymentDetails = mongoose.models.PaymentDetails || mongoose.model('PaymentDetails', paymentDetailsSchema);

export default PaymentDetails;