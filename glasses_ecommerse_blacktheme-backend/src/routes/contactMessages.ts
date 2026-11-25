import express from 'express'
import { ContactMessage } from '../models/ContactMessage'
import { requireAuth, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Simple per-IP limit so the public form can't be flooded
const recent = new Map<string, number[]>()
function tooMany(ip: string) {
  const now = Date.now()
  const list = (recent.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  list.push(now)
  recent.set(ip, list)
  return list.length > 5
}

// Public: Contact Us form
router.post('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim()
    const phone = String(req.body?.phone || '').trim()
    const subject = String(req.body?.subject || '').trim()
    const message = String(req.body?.message || '').trim()

    const missing = [!name && 'name', !email && 'email', !message && 'message'].filter(Boolean)
    if (missing.length) return res.status(400).json({ error: `Please fill in your ${missing.join(', ')}` })
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' })
    if (message.length > 5000) return res.status(400).json({ error: 'Message is too long (max 5000 characters)' })
    // Behind the proxy every request shares one req.ip, so use the visitor's forwarded address
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown'
    if (tooMany(ip)) return res.status(429).json({ error: 'Too many messages. Please try again in a few minutes.' })

    const doc = await ContactMessage.create({ name, email, phone, subject, message, userId: req.user?.id })
    res.status(201).json({ success: true, id: doc._id })
  } catch (error: any) {
    res.status(500).json({ error: 'Could not send your message. Please try again.' })
  }
})

// Admin: list messages (newest first), optional ?status=
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const filter: any = {}
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status
    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(1000).populate('userId', 'name phone email')
    const unread = await ContactMessage.countDocuments({ status: 'new' })
    res.json({ messages, unread })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: update status / notes
router.patch('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const update: any = {}
    if (['new', 'in_progress', 'resolved'].includes(req.body?.status)) update.status = req.body.status
    if (typeof req.body?.adminNotes === 'string') update.adminNotes = req.body.adminNotes
    const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
    if (!doc) return res.status(404).json({ error: 'Message not found' })
    res.json(doc)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: delete
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
