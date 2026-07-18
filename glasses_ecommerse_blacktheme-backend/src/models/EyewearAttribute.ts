import { Schema, model, Document } from 'mongoose'

export interface IEyewearAttribute extends Document {
    type: 'frameShape' | 'frameMaterial' | 'faceShape' | 'feature' | 'gender' | 'frameType'
    name: string
    image?: string
}

const EyewearAttributeSchema = new Schema<IEyewearAttribute>({
    type: {
        type: String,
        required: true,
        enum: ['frameShape', 'frameMaterial', 'faceShape', 'feature', 'gender', 'frameType'],
        index: true
    },
    name: { type: String, required: true },
    image: { type: String }
}, { timestamps: true })

// Ensure name is unique per type
EyewearAttributeSchema.index({ type: 1, name: 1 }, { unique: true })

export const EyewearAttribute = model<IEyewearAttribute>('EyewearAttribute', EyewearAttributeSchema)
