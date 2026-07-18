import { Schema, model, Types } from 'mongoose'

export interface IInquiry {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  quantity: number;
  message: string;
  status: 'pending' | 'reviewed' | 'responded' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'responded', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

export const Inquiry = model<IInquiry>('Inquiry', inquirySchema)
