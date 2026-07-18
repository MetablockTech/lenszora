import { Schema, model, Document, Types } from 'mongoose'

export interface IVendorPayout extends Document {
    vendorId: Types.ObjectId
    amount: number
    commissionDeducted: number
    netAmount: number
    periodStart: Date
    periodEnd: Date
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    paymentMethod: string
    transactionId?: string
    transactionDetails?: any
    notes?: string
    processedBy?: Types.ObjectId
    processedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const VendorPayoutSchema = new Schema<IVendorPayout>({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    amount: { type: Number, required: true },
    commissionDeducted: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String },
    transactionDetails: { type: Schema.Types.Mixed },
    notes: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date }
}, { timestamps: true })

export const VendorPayout = model<IVendorPayout>('VendorPayout', VendorPayoutSchema)
