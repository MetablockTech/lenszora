import { Schema, model, Document, Types } from 'mongoose'

export interface ICoupon extends Document {
  code: string
  discountType: 'flat' | 'percent'
  discountValue: number
  minOrderAmount: number
  maxDiscount?: number
  userId?: Types.ObjectId // If specific to a user (e.g. User A)
  isReferralReward: boolean
  usageLimit: number
  timesUsed: number
  expiryDate?: Date
  isActive: boolean
  createdAt: Date
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['flat', 'percent'], default: 'flat' },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  isReferralReward: { type: Boolean, default: false },
  usageLimit: { type: Number, default: 1 },
  timesUsed: { type: Number, default: 0 },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

export const Coupon = model<ICoupon>('Coupon', CouponSchema)
