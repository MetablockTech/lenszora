import { Schema, model, Document, Types } from 'mongoose'

// A customer reserves a product online and visits the vendor's store to buy it.
// The vendor verifies the visit pass (code / QR) at the store, so offline sales of
// products discovered on the site are tracked and admin earns commission on them.
export type StoreVisitStatus = 'booked' | 'verified' | 'sold' | 'not_purchased' | 'expired' | 'cancelled'

export interface IStoreVisit extends Document {
  code: string
  userId: Types.ObjectId
  customerName?: string
  customerPhone: string
  productId: Types.ObjectId
  productTitle: string
  productImage?: string
  variantSku?: string
  color?: string
  storeId: Types.ObjectId
  vendorId: Types.ObjectId
  visitDate: string // yyyy-MM-dd
  expiresAt: Date
  priceAtBooking: number
  commissionRate: number
  status: StoreVisitStatus
  verifiedAt?: Date
  closedAt?: Date
  saleAmount?: number
  billNumber?: string
  notPurchasedReason?: string
  commissionAmount?: number
  commissionStatus: 'none' | 'due' | 'collected'
  commissionCollectedAt?: Date
  // Customer follow-up: did they actually buy? Mismatch with the vendor's answer is flagged.
  customerSaysPurchased?: boolean
  customerFeedbackAt?: Date
  flagged: boolean
  createdAt: Date
  updatedAt: Date
}

const StoreVisitSchema = new Schema<IStoreVisit>({
  code: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerName: { type: String },
  customerPhone: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productTitle: { type: String, required: true },
  productImage: { type: String },
  variantSku: { type: String },
  color: { type: String },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  visitDate: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  priceAtBooking: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  status: {
    type: String,
    enum: ['booked', 'verified', 'sold', 'not_purchased', 'expired', 'cancelled'],
    default: 'booked',
    index: true
  },
  verifiedAt: { type: Date },
  closedAt: { type: Date },
  saleAmount: { type: Number },
  billNumber: { type: String },
  notPurchasedReason: { type: String },
  commissionAmount: { type: Number },
  commissionStatus: { type: String, enum: ['none', 'due', 'collected'], default: 'none' },
  commissionCollectedAt: { type: Date },
  customerSaysPurchased: { type: Boolean },
  customerFeedbackAt: { type: Date },
  flagged: { type: Boolean, default: false, index: true }
}, { timestamps: true })

export const StoreVisit = model<IStoreVisit>('StoreVisit', StoreVisitSchema)
