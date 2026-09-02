import { Schema, model, Document } from 'mongoose'

export interface IBrand extends Document {
  name: string
  slug?: string
  logo?: string
  banner?: string
  horizontalBanner?: string
  tagline?: string
  bgColor?: string
  isTrending?: boolean
  showHorizontalSlider?: boolean
}

const BrandSchema = new Schema<IBrand>({
  name: { type: String, required: true },
  slug: { type: String },
  logo: { type: String },
  banner: { type: String },
  horizontalBanner: { type: String },
  tagline: { type: String },
  bgColor: { type: String },
  isTrending: { type: Boolean, default: false },
  showHorizontalSlider: { type: Boolean, default: true }
}, { timestamps: true })

export const Brand = model<IBrand>('Brand', BrandSchema)
