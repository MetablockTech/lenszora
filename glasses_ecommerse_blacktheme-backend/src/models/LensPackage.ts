import { Schema, model, Document, Types } from 'mongoose'
import { IVendor } from './Vendor'

export interface ILensPackage extends Document {
    lensTypeId: Types.ObjectId
    vendorId?: Types.ObjectId | IVendor | null // Null for platform-wide lenses
    name: string
    description?: string
    features: string[]
    price: number
    warranty?: string
    indexLabel?: string // e.g., "1.56", "1.61"
    imageUrl?: string // Specific image for Step 2
    isActive: boolean
}

const LensPackageSchema = new Schema<ILensPackage>({
    lensTypeId: { type: Schema.Types.ObjectId, ref: 'LensType', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', default: null },
    name: { type: String, required: true },
    description: { type: String },
    features: { type: [String], default: [] },
    price: { type: Number, required: true, default: 0 },
    warranty: { type: String },
    indexLabel: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

// Ensure package names are unique per lens type and vendor
LensPackageSchema.index({ lensTypeId: 1, vendorId: 1, name: 1 }, { unique: true })

export const LensPackage = model<ILensPackage>('LensPackage', LensPackageSchema)
