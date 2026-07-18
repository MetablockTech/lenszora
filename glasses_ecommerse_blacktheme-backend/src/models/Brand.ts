import { Schema, model, Document } from 'mongoose'

export interface IBrand extends Document {
  name: string
  slug?: string
  logo?: string
}

const BrandSchema = new Schema<IBrand>({
  name: { type: String, required: true },
  slug: { type: String },
  logo: { type: String }
}, { timestamps: true })

export const Brand = model<IBrand>('Brand', BrandSchema)
