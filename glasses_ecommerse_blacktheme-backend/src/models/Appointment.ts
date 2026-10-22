import { Schema, model, Document, Types } from 'mongoose'

export interface IAppointmentAddress {
  line1: string
  line2?: string
  landmark?: string
  city: string
  state?: string
  pincode: string
}

export interface IAppointment extends Document {
  // 'store' = customer visits a store, 'home' = optometrist visits the customer's home
  visitType: 'store' | 'home'
  storeId?: Types.ObjectId
  vendorId?: Types.ObjectId
  userId?: Types.ObjectId
  customerName: string
  customerPhone: string
  appointmentDate: string
  timeSlot: string
  reason?: string
  address?: IAppointmentAddress
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

const AddressSchema = new Schema<IAppointmentAddress>({
  line1: { type: String, required: true },
  line2: { type: String },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  pincode: { type: String, required: true }
}, { _id: false })

const AppointmentSchema = new Schema<IAppointment>({
  visitType: { type: String, enum: ['store', 'home'], default: 'store' },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: function (this: IAppointment) { return this.visitType !== 'home' }
  },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  appointmentDate: { type: String, required: true },
  timeSlot: { type: String, required: true },
  reason: { type: String, default: 'Eye Test' },
  address: { type: AddressSchema },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true })

export const Appointment = model<IAppointment>('Appointment', AppointmentSchema)
