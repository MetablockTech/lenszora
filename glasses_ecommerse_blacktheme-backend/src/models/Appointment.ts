import { Schema, model, Document, Types } from 'mongoose'

export interface IAppointment extends Document {
  storeId: Types.ObjectId
  vendorId?: Types.ObjectId
  customerName: string
  customerPhone: string
  appointmentDate: string
  timeSlot: string
  reason?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

const AppointmentSchema = new Schema<IAppointment>({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  appointmentDate: { type: String, required: true },
  timeSlot: { type: String, required: true },
  reason: { type: String, default: 'Eye Test' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true })

export const Appointment = model<IAppointment>('Appointment', AppointmentSchema)
