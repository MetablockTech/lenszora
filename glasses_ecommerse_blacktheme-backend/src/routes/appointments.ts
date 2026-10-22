import { Router, Response } from 'express'
import { Appointment } from '../models/Appointment'
import { Store } from '../models/Store'
import { optAuth, requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

// Create a new appointment (store visit, or eye test at the customer's home)
router.post('/', optAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, appointmentDate, timeSlot, reason, address } = req.body
    const visitType = req.body.visitType === 'home' ? 'home' : 'store'
    const customerName = clean(req.body.customerName)
    const customerPhone = clean(req.body.customerPhone).replace(/[\s-]/g, '')

    if (!customerName || !customerPhone || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: 'Name, phone, date and time slot are required' })
    }
    if (!/^\+?\d{10,13}$/.test(customerPhone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number' })
    }

    if (visitType === 'home') {
      const homeAddress = {
        line1: clean(address?.line1),
        line2: clean(address?.line2) || undefined,
        landmark: clean(address?.landmark) || undefined,
        city: clean(address?.city),
        state: clean(address?.state) || undefined,
        pincode: clean(address?.pincode)
      }
      if (!homeAddress.line1 || !homeAddress.city) {
        return res.status(400).json({ message: 'House/street address and city are required for a home visit' })
      }
      if (!/^\d{6}$/.test(homeAddress.pincode)) {
        return res.status(400).json({ message: 'Please enter a valid 6-digit pincode' })
      }

      const appointment = await Appointment.create({
        visitType: 'home',
        userId: req.user?.id,
        customerName,
        customerPhone,
        appointmentDate,
        timeSlot,
        reason: clean(reason) || 'Eye Test at Home',
        address: homeAddress,
        status: 'pending'
      })
      return res.status(201).json(appointment)
    }

    const store = await Store.findById(storeId)
    if (!store) {
      return res.status(404).json({ message: 'Store not found' })
    }

    const appointment = await Appointment.create({
      visitType: 'store',
      storeId,
      vendorId: store.vendorId, // Inherit vendorId from store
      userId: req.user?.id,
      customerName,
      customerPhone,
      appointmentDate,
      timeSlot,
      reason: clean(reason) || 'Eye Test',
      status: 'pending'
    })
    res.status(201).json(appointment)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// List appointments.
// Admin: everything. Vendor: only their own store bookings.
// Public (booking modal): only the taken time slots for one store + date, no customer data.
router.get('/', optAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, date, visitType } = req.query
    const role = req.user?.role

    if (role !== 'admin' && role !== 'vendor') {
      if (!storeId || !date) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const taken = await Appointment.find({ storeId, appointmentDate: date, status: { $ne: 'cancelled' } }).select('timeSlot -_id').lean()
      return res.json(taken)
    }

    const filter: any = {}
    if (storeId) filter.storeId = storeId
    if (date) filter.appointmentDate = date
    if (visitType === 'home' || visitType === 'store') filter.visitType = visitType

    if (role === 'vendor') {
      // Store.vendorId may hold either the vendor profile id or the vendor's user id
      filter.vendorId = { $in: [req.user!.vendorId, req.user!.id].filter(Boolean) }
    } else if (req.query.vendorId) {
      filter.vendorId = req.query.vendorId
    }

    const appointments = await Appointment.find(filter).populate('storeId', 'name').sort({ createdAt: -1 })
    res.json(appointments)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// Update appointment status (admin, or the vendor who owns the store)
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    const role = req.user!.role
    const ownsIt = role === 'vendor' && appointment.vendorId &&
      [req.user!.vendorId, req.user!.id].includes(appointment.vendorId.toString())
    if (role !== 'admin' && !ownsIt) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    appointment.status = status
    await appointment.save()
    await appointment.populate('storeId', 'name')
    res.json(appointment)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
