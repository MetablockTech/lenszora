import { Schema, model, Types } from 'mongoose'

export interface IOrderItem {
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
  image: string;
  commission?: number;
  vendorAmount?: number;
  lens?: {
    typeId: string;
    typeName: string;
    packageId: string;
    packageName: string;
    price: number;
    prescription?: {
      od: { sph: string; cyl: string; axis: string };
      os: { sph: string; cyl: string; axis: string };
      pd: string;
    };
  };
}

export interface IVendorOrder {
  vendorId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  commission: number;
  vendorAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped' | 'partially_delivered';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  deliveryOtp?: string;
}

export interface IOrder {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  items: IOrderItem[];
  vendorOrders: IVendorOrder[]; // Split order by vendor
  total: number;
  totalCommission?: number;
  shippingCharge?: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded' | 'partially_shipped' | 'partially_delivered';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentProof?: string;
  utrNumber?: string;
  manualPaymentDetails?: any;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        vendorId: {
          type: Schema.Types.ObjectId,
          ref: 'Vendor',
          required: true,
        },
        title: String,
        price: Number,
        quantity: Number,
        image: String,
        commission: Number,
        vendorAmount: Number,
        lens: {
          typeId: String,
          typeName: String,
          packageId: String,
          packageName: String,
          price: Number,
          prescription: {
            od: { sph: String, cyl: String, axis: String },
            os: { sph: String, cyl: String, axis: String },
            pd: String
          }
        }
      },
    ],
    vendorOrders: [{
      vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
      },
      items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
        title: String,
        price: Number,
        quantity: Number,
        image: String,
        commission: Number,
        vendorAmount: Number,
        lens: {
          typeId: String,
          typeName: String,
          packageId: String,
          packageName: String,
          price: Number,
          prescription: {
            od: { sph: String, cyl: String, axis: String },
            os: { sph: String, cyl: String, axis: String },
            pd: String
          }
        }
      }],
      subtotal: Number,
      commission: Number,
      vendorAmount: Number,
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'partially_shipped', 'partially_delivered'],
        default: 'pending',
      },
      statusHistory: [{
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String
      }],
      deliveryOtp: String
    }],
    total: {
      type: Number,
      required: true,
    },
    totalCommission: {
      type: Number,
      default: 0
    },
    shippingCharge: {
      type: Number,
      default: 0
    },
    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded', 'partially_shipped', 'partially_delivered'],
      default: 'pending',
    },
    statusHistory: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: String
    }],
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentProof: String,
    utrNumber: String,
    manualPaymentDetails: Schema.Types.Mixed,
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
)

export const Order = model<IOrder>('Order', orderSchema)
