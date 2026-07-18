import { Schema, model, Document } from 'mongoose'

export interface ISetting extends Document {
    key: string
    value: any
    type: 'string' | 'number' | 'boolean' | 'json' | 'array'
    category: string
    description?: string
    updatedAt: Date
}

const SettingSchema = new Schema<ISetting>({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'json', 'array'], default: 'string' },
    category: { type: String, default: 'general' },
    description: { type: String }
}, { timestamps: true })

export const Setting = model<ISetting>('Setting', SettingSchema)
