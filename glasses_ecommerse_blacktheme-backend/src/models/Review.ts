import { Schema, model, Document, Types } from 'mongoose'

export interface IReview extends Document {
    user: Types.ObjectId
    product: Types.ObjectId
    rating: number
    title: string
    comment: string
    isVerified: boolean
    createdAt: Date
}

const ReviewSchema = new Schema<IReview>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true })

// Index for faster lookups
ReviewSchema.index({ product: 1, createdAt: -1 })
ReviewSchema.index({ user: 1, product: 1 }, { unique: true }) // One review per user per product

export const Review = model<IReview>('Review', ReviewSchema)
