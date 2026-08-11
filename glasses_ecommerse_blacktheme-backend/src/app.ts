import express from 'express'
import cors from 'cors'
import path from 'path'

import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import categoryRoutes from './routes/categories'
import brandRoutes from './routes/brands'
import ordersRoutes from './routes/orders'
import settingsRoutes from './routes/settings'
import dashboardRoutes from './routes/dashboard'
import uploadRoutes from './routes/upload'
import wishlistRoutes from './routes/wishlist'
import reviewRoutes from './routes/review'
import usersRoutes from './routes/users'
import pincodeRoutes from './routes/pincodes'
import addressRoutes from './routes/addresses'
import navigationRoutes from './routes/navigation'

import returnRequestsRoutes from './routes/returnRequests'
import vendorRoutes from './routes/vendors'
import commissionRoutes from './routes/commissions'
import payoutRoutes from './routes/payouts'
import eyewearAttributesRoutes from './routes/eyewearAttributes'
import lensRoutes from './routes/lens'
import sliderRoutes from './routes/sliders'
import storesRoutes from './routes/stores'
import appointmentRoutes from './routes/appointments'
import inquiryRoutes from './routes/inquiries'

export function startServer() {
  const app = express()

  // CORS configuration - Allow all origins
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  app.use(express.json())

  // Serve uploaded files
  const uploadsDir = path.join(__dirname, '..', 'uploads')
  app.use('/uploads', express.static(uploadsDir))

  app.use('/api/auth', authRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/brands', brandRoutes)
  app.use('/api/orders', ordersRoutes)
  app.use('/api/settings', settingsRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/upload', uploadRoutes)
  app.use('/api/wishlist', wishlistRoutes)
  app.use('/api/reviews', reviewRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/pincodes', pincodeRoutes)
  app.use('/api/addresses', addressRoutes)
  app.use('/api/navigation', navigationRoutes)
  app.use('/api/return-requests', returnRequestsRoutes)
  app.use('/api/vendors', vendorRoutes)
  app.use('/api/commissions', commissionRoutes)
  app.use('/api/payouts', payoutRoutes)
  app.use('/api/eyewear-attributes', eyewearAttributesRoutes)
  app.use('/api/lens', lensRoutes)
  app.use('/api/sliders', sliderRoutes)
  app.use('/api/stores', storesRoutes)
  app.use('/api/appointments', appointmentRoutes)
  app.use('/api/inquiries', inquiryRoutes)

  app.get('/', (req, res) => res.json({ ok: true }))

  return app
}
