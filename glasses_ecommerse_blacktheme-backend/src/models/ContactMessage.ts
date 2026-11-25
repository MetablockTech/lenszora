import { Schema, model, Types } from 'mongoose'

// A message sent from the website's Contact Us form
export interface IContactMessage {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  userId?: Types.ObjectId
  status: 'new' | 'in_progress' | 'resolved'
  adminNotes?: string
  createdAt?: Date
  updatedAt?: Date
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 20 },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['new', 'in_progress', 'resolved'], default: 'new' },
    adminNotes: { type: String, maxlength: 5000 },
  },
  { timestamps: true }
)

export const ContactMessage = model<IContactMessage>('ContactMessage', contactMessageSchema)
