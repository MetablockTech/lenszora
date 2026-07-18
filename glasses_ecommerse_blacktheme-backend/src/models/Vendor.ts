import { Schema, model, Document, Types } from 'mongoose'

export interface IVendor extends Document {
    userId: Types.ObjectId
    businessName: string
    slug: string
    description?: string
    logo?: string
    banner?: string

    // Contact Information
    email: string
    phone: string
    address: {
        street: string
        city: string
        state: string
        zipCode: string
        country: string
    }

    // Business Details
    businessLicense?: string
    taxId?: string
    gstNumber?: string

    // Bank Details for Payouts
    bankDetails: {
        accountHolderName: string
        accountNumber: string
        bankName: string
        ifscCode: string
        branch?: string
        upiId?: string
    }

    // Verification & Status
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
    verificationNotes?: string

    // Commission
    commissionRate: number // Percentage (e.g., 15 means 15%)

    // Documents
    documents: Array<{
        type: string
        url: string
        uploadedAt: Date
    }>

    // Earnings & Balance
    pendingBalance: number   // Earned but in holding period
    availableBalance: number // Ready for withdrawal
    totalEarned: number      // Lifetime total earnings
    
    // Statistics
    totalProducts: number
    totalSales: number
    totalRevenue: number
    rating: number
    totalReviews: number

    createdAt: Date
    updatedAt: Date
}

const VendorSchema = new Schema<IVendor>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    businessName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String },
    banner: { type: String },

    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'India' }
    },

    businessLicense: { type: String },
    taxId: { type: String },
    gstNumber: { type: String },

    bankDetails: {
        accountHolderName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        bankName: { type: String, required: true },
        ifscCode: { type: String, required: true },
        branch: { type: String },
        upiId: { type: String }
    },

    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    verificationNotes: { type: String },

    commissionRate: { type: Number, required: true, default: 15 },

    documents: [{
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],

    pendingBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },

    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true })

// Create slug from business name before saving
VendorSchema.pre('save', function (next) {
    if (this.isModified('businessName') && !this.slug) {
        this.slug = this.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }
    next()
})

export const Vendor = model<IVendor>('Vendor', VendorSchema)
