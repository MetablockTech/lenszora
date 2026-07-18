import { Schema, model, Document, Types } from 'mongoose'

export interface IProductVariant {
  sku: string
  price: number
  stock: number
  images?: string[]
  variantValues: Record<string, string> // e.g., { "Storage": "512GB", "Color": "Blue Titanium" }
  isDefault?: boolean
}

export interface IProduct extends Document {
  title: string
  slug?: string
  description?: string
  price: number // Base price (used if no variants)
  images: string[]
  thumbnail?: string
  category?: Types.ObjectId
  brand?: Types.ObjectId
  vendorId: Types.ObjectId // Vendor who owns this product
  stock?: number // Base stock (used if no variants)
  productType: 'physical' | 'digital'
  sku: string // Base SKU
  unit: string
  searchTags: string[]
  minOrderQuantity: number
  discountAmount: number
  discountType: 'flat' | 'percent'
  shippingCost: number
  shippingCostMultiply: boolean
  status: 'active' | 'inactive' | 'pending' | 'rejected'
  rejectionReason?: string
  colors: string[]
  attributes: Array<{ name: string; values: string[] }>
  variants?: IProductVariant[] // Optional variant configurations
  hasVariants: boolean // Flag to indicate if product uses variant system
  averageRating: number
  totalReviews: number
  returnPolicy: {
    allowReturns: boolean
    allowRefunds: boolean
    returnPeriodDays: number
    policyText?: string
  }
  isBestSeller: boolean
  isFeatured: boolean
  isBulk: boolean // Targeted exclusively for vendors
  totalOrders: number
  wishlistCount: number
  // Eyewear-specific fields
  eyewearDetails?: {
    frameType?: string // Full Rim, Half Rim, Rimless
    frameShape?: string // Round, Square, Aviator, Cat-Eye, Wayfarer, Rectangle, Oval, etc.
    frameMaterial?: string // Plastic, Metal, Titanium, Acetate, TR90, Stainless Steel
    frameSize?: string // Wide, Medium, Narrow
    frameWidth?: string // e.g. 142 mm
    frameDimensions?: string // e.g. 53-23-147
    frameColor?: string
    glassColor?: string // For ready-made sunglasses
    weight?: string // e.g. 33 gm
    weightGroup?: string // Average, Light
    countryOfOrigin?: string
    modelNo?: string
    prescriptionAvailable?: boolean
    gender?: string // Men, Women, Unisex, Kids
    faceShape?: string[] // Recommended face shapes
    uvProtection?: string
    polarized?: boolean
    features?: string[]
  }
  lensSettings?: {
    allowLensSelection: boolean
    useVendorLenses: boolean // If true, only show lenses created by this vendor
    enabledLensTypes?: Types.ObjectId[] // Specific lens types allowed for this product
  }
  createdAt: Date
}

const ProductVariantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  images: { type: [String], default: [] },
  variantValues: { type: Schema.Types.Mixed, required: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false })

const ProductSchema = new Schema<IProduct>({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  images: { type: [String], default: [] },
  thumbnail: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  stock: { type: Number, default: 0 },
  productType: { type: String, default: 'physical' },
  sku: { type: String, required: true },
  unit: { type: String, required: true },
  searchTags: { type: [String], default: [] },
  minOrderQuantity: { type: Number, default: 1 },
  discountAmount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['flat', 'percent'], default: 'flat' },
  shippingCost: { type: Number, default: 0 },
  shippingCostMultiply: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  colors: { type: [String], default: [] },
  attributes: [{
    name: { type: String },
    values: { type: [String] }
  }],
  variants: { type: [ProductVariantSchema], default: [] },
  hasVariants: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  returnPolicy: {
    allowReturns: { type: Boolean, default: true },
    allowRefunds: { type: Boolean, default: true },
    returnPeriodDays: { type: Number, default: 14 },
    policyText: { type: String }
  },
  eyewearDetails: {
    frameType: { type: String },
    frameShape: { type: String },
    frameMaterial: { type: String },
    frameSize: { type: String },
    frameWidth: { type: String },
    frameDimensions: { type: String },
    frameColor: { type: String },
    glassColor: { type: String },
    weight: { type: String },
    weightGroup: { type: String },
    countryOfOrigin: { type: String },
    modelNo: { type: String },
    prescriptionAvailable: { type: Boolean, default: false },
    gender: { type: String },
    faceShape: { type: [String], default: [] },
    uvProtection: { type: String },
    polarized: { type: Boolean, default: false },
    features: { type: [String], default: [] }
  },
  lensSettings: {
    allowLensSelection: { type: Boolean, default: false },
    useVendorLenses: { type: Boolean, default: false }, // Legacy field, can be kept for now
    lensTypes: [{
      lensTypeId: { type: Schema.Types.ObjectId, ref: 'LensType' },
      skipPackages: { type: Boolean, default: false },
      packages: [{
        name: { type: String, required: true },
        price: { type: Number, required: true, default: 0 },
        description: { type: String },
        features: { type: [String], default: [] },
        detailedFeatures: [{
          title: { type: String },
          description: { type: String },
          image: { type: String },
          icon: { type: String } // e.g. 'Shield', 'Zap', 'Eye'
        }],
        benefits: { type: [String], default: [] }, // Top highlights with icons
        imageUrl: { type: String },
        warranty: { type: String },
        indexLabel: { type: String }
      }]
    }],
    directLensOptions: [{ // Fallback for simple flat lists
      name: { type: String, required: true },
      price: { type: Number, required: true, default: 0 },
      description: { type: String }
    }]
  },
  isBestSeller: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isBulk: { type: Boolean, default: false },
  totalOrders: { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
}, { timestamps: true })

export const Product = model<IProduct>('Product', ProductSchema)
