import { Schema, model, Document, Types } from 'mongoose'

export interface ICategory extends Document {
  name: string
  slug?: string
  parentId?: Types.ObjectId | null
  level: 'main' | 'sub' | 'subsub'
  description?: string
  allowLensSelection?: boolean
  showFrameDetails?: boolean
  image?: string
  icon?: string
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, index: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: String, enum: ['main', 'sub', 'subsub'], default: 'main' },
  description: { type: String },
  allowLensSelection: { type: Boolean, default: false },
  showFrameDetails: { type: Boolean, default: false },
  image: { type: String },
  icon: { type: String }
}, { timestamps: true })

export const Category = model<ICategory>('Category', CategorySchema)
