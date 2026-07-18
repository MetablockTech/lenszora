import { Router, Request, Response } from 'express'
import { Appointment } from '../models/Appointment'
import { Store } from '../models/Store'

const router = Router()

// Create a new appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { storeId, customerName, customerPhone, appointmentDate, timeSlot } = req.body

    const store = await Store.findById(storeId)
    if (!store) {
      return res.status(404).json({ message: 'Store not found' })
    }

    const appointment = new Appointment({
      storeId,
      vendorId: store.vendorId, // Inherit vendorId from store
      customerName,
      customerPhone,
      appointmentDate,
      timeSlot,
      status: 'pending'
    })

    await appointment.save()
    res.status(201).json(appointment)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// Get appointments (Example for admin/vendor)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { storeId, vendorId, date } = req.query
    const filter: any = {}
    if (storeId) filter.storeId = storeId
    if (vendorId) filter.vendorId = vendorId
    if (date) filter.appointmentDate = date

    const appointments = await Appointment.find(filter).populate('storeId', 'name').sort({ createdAt: -1 })
    res.json(appointments)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

// Update appointment status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('storeId', 'name')

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    res.json(appointment)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router
