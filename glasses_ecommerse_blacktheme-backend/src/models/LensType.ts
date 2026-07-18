import { Schema, model, Document, Types } from 'mongoose'
import { IVendor } from './Vendor'

export interface ILensType extends Document {
    name: string
    subtitle?: string // e.g., "Positive, Negative or Cylindrical"
    description?: string
    imageUrl?: string // Icon/image for Step 1
    isActive: boolean
    allowPackages: boolean // If false, skip Step 2 on storefront
    skipPowerEntry: boolean // If true, skip Step 3 (prescription) on storefront
    vendorId?: Types.ObjectId | IVendor | null // Null for platform-wide lenses
}

const LensTypeSchema = new Schema<ILensType>({
    name: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    allowPackages: { type: Boolean, default: true },
    skipPowerEntry: { type: Boolean, default: false },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', default: null }
}, { timestamps: true })

// Unique name per vendor (or platform)
LensTypeSchema.index({ vendorId: 1, name: 1 }, { unique: true })

export const LensType = model<ILensType>('LensType', LensTypeSchema)
