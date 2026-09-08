import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, X, CheckCircle, Package, MapPin, Phone, Mail, ShieldCheck, Download } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { getImageUrl } from '@/lib/utils'

export interface OrderReceiptItem {
  productId: string | any;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  lens?: {
    name?: string;
    typeName?: string;
    packageName?: string;
    price: number;
    prescription?: {
      od: { sph: string; cyl: string; axis: string };
      os: { sph: string; cyl: string; axis: string };
      pd: string;
    };
  };
}

export interface OrderReceiptData {
  _id: string;
  createdAt: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | string;
  orderStatus: string;
  total: number;
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
  items: OrderReceiptItem[];
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  utrNumber?: string;
}

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderReceiptData | null;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { settings } = useSettings()

  if (!isOpen || !order) return null

  const handlePrint = () => {
    window.print()
  }

  const invoiceNo = `INV-${order._id.slice(-8).toUpperCase()}`
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Financial calculations
  const framesSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const lensSubtotal = order.items.reduce((sum, item) => sum + ((item.lens?.price || 0) * item.quantity), 0)
  const grandTotal = framesSubtotal + lensSubtotal
  
  // Tax calculations (Estimated 18% GST included)
  const gstRate = 0.18
  const baseAmount = grandTotal / (1 + gstRate)
  const gstTotal = grandTotal - baseAmount
  const cgst = gstTotal / 2
  const sgst = gstTotal / 2

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto no-print">
        <style>
          {`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-receipt, #printable-receipt * {
                visibility: visible !important;
              }
              #printable-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 20px !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-8"
        >
          {/* Action Bar (Top) */}
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800 no-print">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-white">Order Receipt & Tax Invoice</h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-yellow-500/20"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div id="printable-receipt" className="p-8 bg-white text-zinc-900 text-sm font-sans leading-relaxed">
            {/* Header: Company Info & Invoice Badge */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-zinc-200 gap-4">
              <div>
                {settings.logoUrl ? (
                  <img
                    src={getImageUrl(settings.logoUrl)}
                    alt={settings.websiteName}
                    className="h-10 object-contain mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                    {settings.websiteName.toUpperCase()}
                  </h1>
                )}
                <p className="text-xs text-zinc-500 font-medium">Premium Eyewear & Optical Store</p>
                {settings.contactInfo?.address && (
                  <p className="text-xs text-zinc-600 mt-1 max-w-xs">{settings.contactInfo.address}</p>
                )}
                <p className="text-xs text-zinc-600 mt-0.5">
                  Email: {settings.contactInfo?.email || 'support@lenszora.com'} | Tel: {settings.contactInfo?.phone || '+91 9876543210'}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded mb-2">
                  Tax Invoice
                </span>
                <p className="text-xs font-semibold text-zinc-500">Invoice No:</p>
                <p className="text-base font-black text-zinc-900 font-mono">{invoiceNo}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Date: <span className="font-semibold">{orderDate}</span> at {orderTime}
                </p>
              </div>
            </div>

            {/* Billing / Order Meta Details Grid */}
            <div className="grid sm:grid-cols-2 gap-6 my-6 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Billed & Shipped To:</h4>
                <p className="font-bold text-zinc-900 text-base">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p className="text-zinc-700 text-xs mt-1">
                  {order.shippingAddress.address}
                </p>
                <p className="text-zinc-700 text-xs">
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                </p>
                <p className="text-zinc-700 text-xs">{order.shippingAddress.country}</p>
                <p className="text-zinc-700 text-xs mt-1 font-mono">
                  Ph: {order.shippingAddress.phone} | Email: {order.shippingAddress.email}
                </p>
              </div>

              <div className="sm:border-l sm:border-zinc-200 sm:pl-6 space-y-1.5 text-xs">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Order Information:</h4>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Order Ref ID:</span>
                  <span className="font-mono font-bold text-zinc-900">#{order._id.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Payment Status:</span>
                  <span className={`font-bold uppercase ${order.paymentStatus === 'completed' ? 'text-green-700' : 'text-amber-700'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Transaction Ref:</span>
                    <span className="font-mono text-zinc-800">{order.razorpayPaymentId}</span>
                  </div>
                )}
                {order.utrNumber && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">UTR / Reference:</span>
                    <span className="font-mono text-zinc-800">{order.utrNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600">Fulfillment Status:</span>
                  <span className="font-bold text-zinc-900 uppercase">{order.orderStatus}</span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="p-3">#</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs">
                  {order.items.map((item, idx) => {
                    const itemUnitPrice = item.price + (item.lens?.price || 0)
                    const itemLineTotal = itemUnitPrice * item.quantity

                    return (
                      <React.Fragment key={idx}>
                        <tr className="align-top">
                          <td className="p-3 font-bold text-zinc-400">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-zinc-900 text-sm">{item.title}</p>
                            
                            {item.lens && (
                              <div className="mt-1 text-zinc-700">
                                <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded mr-1">
                                  LENS INCLUDED
                                </span>
                                <span className="font-semibold text-xs">
                                  {item.lens.packageName || item.lens.name || 'Custom Prescribed Lens'}
                                </span>
                                {item.lens.price > 0 && (
                                  <span className="text-zinc-500 font-medium ml-1">
                                    (+₹{item.lens.price.toLocaleString()})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Prescription Sub-Table if present */}
                            {item.lens?.prescription && (
                              <div className="mt-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded text-[11px]">
                                <p className="font-bold text-zinc-700 uppercase tracking-widest text-[9px] mb-1">
                                  Optical Prescription
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="font-bold text-zinc-900">OD (Right Eye):</span> SPH: {item.lens.prescription.od?.sph || '0.00'}, CYL: {item.lens.prescription.od?.cyl || '0.00'}, AXIS: {item.lens.prescription.od?.axis || '0'}°
                                  </div>
                                  <div>
                                    <span className="font-bold text-zinc-900">OS (Left Eye):</span> SPH: {item.lens.prescription.os?.sph || '0.00'}, CYL: {item.lens.prescription.os?.cyl || '0.00'}, AXIS: {item.lens.prescription.os?.axis || '0'}°
                                  </div>
                                </div>
                                {item.lens.prescription.pd && (
                                  <p className="mt-1 text-zinc-600">
                                    <span className="font-bold text-zinc-900">PD:</span> {item.lens.prescription.pd} mm
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold text-zinc-900">{item.quantity}</td>
                          <td className="p-3 text-right text-zinc-700">₹{itemUnitPrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-zinc-900">₹{itemLineTotal.toLocaleString()}</td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-t-2 border-zinc-200 pt-4 gap-6">
              <div className="text-xs text-zinc-600 max-w-sm space-y-1">
                <p className="font-bold text-zinc-900">Tax & Statutory Notes:</p>
                <p>• GST Included @ 18% on Optical Frames & Lenses.</p>
                <p>• CGST: ₹{cgst.toFixed(2)} | SGST: ₹{sgst.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-500 mt-2">
                  This is a computer-generated tax invoice and does not require a physical signature.
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Frames Subtotal:</span>
                  <span>₹{framesSubtotal.toLocaleString()}</span>
                </div>
                {lensSubtotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Lens Upgrades:</span>
                    <span>₹{lensSubtotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping & Delivery:</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
                <div className="border-t border-zinc-300 pt-2 flex justify-between text-base font-black text-zinc-900">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-green-50 border border-green-200 rounded text-center text-green-800 font-bold text-xs flex items-center justify-center gap-1.5 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Amount Paid in Full
                </div>
              </div>
            </div>

            {/* Terms & Footer Note */}
            <div className="mt-8 pt-4 border-t border-zinc-200 text-center text-[10px] text-zinc-500">
              <p className="font-semibold text-zinc-700">Thank you for choosing {settings.websiteName}!</p>
              <p>For any queries or support regarding this invoice, please contact support@lenszora.com</p>
            </div>
          </div>

          {/* Modal Footer (Screen only) */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-zinc-950 border-t border-zinc-800 no-print">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default OrderReceiptModal
