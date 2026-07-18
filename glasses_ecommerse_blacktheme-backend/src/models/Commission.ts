import { Schema, model, Document, Types } from 'mongoose'

export interface ICommission extends Document {
    defaultRate: number // Default commission percentage
    categoryRates: Array<{
        categoryId: Types.ObjectId
        rate: number
    }>
    vendorRates: Array<{
        vendorId: Types.ObjectId
        rate: number
    }>
    updatedAt: Date
}

const CommissionSchema = new Schema<ICommission>({
    defaultRate: { type: Number, required: true, default: 15 },
    categoryRates: [{
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        rate: { type: Number, required: true }
    }],
    vendorRates: [{
        vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
        rate: { type: Number, required: true }
    }]
}, { timestamps: true })

export const Commission = model<ICommission>('Commission', CommissionSchema)
