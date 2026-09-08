import { Schema, model, Document, Types } from 'mongoose'

export interface IUser extends Document {
  email?: string
  password?: string
  name?: string
  phone: string
  otp?: string
  otpExpires?: Date
  role: 'user' | 'admin' | 'vendor' | 'agent'
  vendorId?: Types.ObjectId
  wishlist: Types.ObjectId[]
  cart?: Array<{
    productId: Types.ObjectId | string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    lens?: any;
    variant?: any;
    updatedAt?: Date;
  }>
  referralCode?: string
  referredBy?: Types.ObjectId
  hasPlacedFirstOrder?: boolean
  referralCount?: number
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: { type: String },
  phone: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpires: { type: Date },
  role: { type: String, enum: ['user', 'admin', 'vendor', 'agent'], default: 'user' },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    price: Number,
    quantity: Number,
    image: String,
    lens: Schema.Types.Mixed,
    variant: Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
  }],
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  hasPlacedFirstOrder: { type: Boolean, default: false },
  referralCount: { type: Number, default: 0 }
}, { timestamps: true })

export const User = model<IUser>('User', UserSchema)
