import { Schema, model, Document, Types } from 'mongoose'

export interface IStore extends Document {
  name: string
  addressLine: string
  city: string
  state: string
  pincode: string
  phone: string
  email?: string
  hours: string
  rating: number
  totalReviews: number
  vendorId?: Types.ObjectId
  images: string[]
  services: string[]
  isActive: boolean
  freeGift?: boolean
  mapUrl?: string
  location?: {
    type: string
    coordinates: number[]
  }
}

const StoreSchema = new Schema<IStore>({
  name: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  hours: { type: String, default: '10:00 AM - 9:00 PM' },
  rating: { type: Number, default: 4.5 },
  totalReviews: { type: Number, default: 0 },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  images: [{ type: String }],
  services: [{ type: String }], // e.g., ["Free Eye Test", "Free Repair"]
  isActive: { type: Boolean, default: true },
  freeGift: { type: Boolean, default: false },
  mapUrl: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  }
}, { timestamps: true })

StoreSchema.index({ location: '2dsphere' })

export const Store = model<IStore>('Store', StoreSchema)
