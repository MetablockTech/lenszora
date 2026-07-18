import { Schema, model, Document, Types } from 'mongoose'

export interface IUser extends Document {
  email?: string
  password?: string
  name?: string
  phone: string
  otp?: string
  otpExpires?: Date
  role: 'user' | 'admin' | 'vendor'
  vendorId?: Types.ObjectId
  wishlist: Types.ObjectId[]
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: { type: String },
  phone: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpires: { type: Date },
  role: { type: String, enum: ['user', 'admin', 'vendor'], default: 'user' },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true })

export const User = model<IUser>('User', UserSchema)
