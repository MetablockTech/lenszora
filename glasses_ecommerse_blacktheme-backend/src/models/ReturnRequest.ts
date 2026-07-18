import { Schema, model, Document, Types } from 'mongoose'

export interface IReturnRequest extends Document {
  orderId: Types.ObjectId
  productId: Types.ObjectId
  userId: Types.ObjectId
  variantSku?: string
  requestType: 'return' | 'refund' | 'exchange'
  reason: string
  description?: string
  images: string[]
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  adminNotes?: string
  refundAmount?: number
  requestedAt: Date
  respondedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ReturnRequestSchema = new Schema<IReturnRequest>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  variantSku: { type: String },
  requestType: { type: String, enum: ['return', 'refund', 'exchange'], required: true },
  reason: { type: String, required: true },
  description: { type: String },
  images: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  adminNotes: { type: String },
  refundAmount: { type: Number },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
}, { timestamps: true })

// Index for faster lookups
ReturnRequestSchema.index({ orderId: 1, productId: 1 })
ReturnRequestSchema.index({ userId: 1 })
ReturnRequestSchema.index({ status: 1 })

export const ReturnRequest = model<IReturnRequest>('ReturnRequest', ReturnRequestSchema)
