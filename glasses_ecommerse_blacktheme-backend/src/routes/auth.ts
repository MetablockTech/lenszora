import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import twilio from 'twilio'

// Twilio Setup (Injected directly to definitively resolve "Cannot find module")
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
const from = process.env.TWILIO_FROM
const template = process.env.TWILIO_OTP_TEMPLATE || 'Dear Customer, your OTP for verification is {#OTP#}'

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null

async function sendOTP(phone: string, otp: string) {
  // For debugging/development: Print OTP to the console so signup works without Twilio
  console.log(`\n========================================\n[DEBUG OTP] Phone: ${phone} | OTP: ${otp}\n========================================\n`)

  if (!twilioClient) {
    console.warn('Twilio client not initialized. Check SID/Token in .env (Using printed OTP instead)')
    return
  }

  // Ensure phone number starts with +91 for India if no country code provided
  let formattedPhone = phone.trim()
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.startsWith('91') ? `+${formattedPhone}` : `+91${formattedPhone}`
  }

  const messageBody = template.replace('{#OTP#}', otp).replace('(#OTP#', otp)
  try {
    const message = await twilioClient.messages.create({
      body: messageBody,
      messagingServiceSid: messagingServiceSid,
      from: !messagingServiceSid ? from : undefined,
      to: formattedPhone
    })
    console.log(`Successfully sent OTP ${otp} to ${formattedPhone}. Message SID: ${message.sid}`)
  } catch (err) {
    console.error('Twilio Send Error details:', err)
    throw err
  }
}

const router = express.Router()

// Debug middleware to see the raw body if parsing fails
router.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`Incoming POST to ${req.path}`, { body: req.body })
  }
  next()
})

// Utility to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

router.post('/send-otp', async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'Phone number is required' })

  const otp = generateOTP()
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  try {
    let user = await User.findOne({ phone })
    if (!user) {
      // For registration, we create the user now but they are unverified 
      // (or we can just save OTP info and create on verify)
      user = new User({ phone, role: 'user' })
    }

    user.otp = otp
    user.otpExpires = otpExpires
    await user.save()

    await sendOTP(phone, otp)
    return res.json({ message: 'OTP sent successfully' })
  } catch (err) {
    console.error('Error in /send-otp:', err)
    return res.status(500).json({ error: 'Failed to send OTP' })
  }
})

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' })

  try {
    const user = await User.findOne({
      phone,
      otp,
      otpExpires: { $gt: new Date() }
    })

    if (!user) return res.status(400).json({ error: 'Invalid or expired OTP' })

    // Clear OTP after successful verification
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    const secret = process.env.JWT_SECRET || 'secret'
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '7d' })

    return res.json({
      token,
      user: { id: user._id, phone: user.phone, role: user.role, email: user.email, vendorId: user.vendorId }
    })
  } catch (err) {
    return res.status(500).json({ error: 'Verification failed' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  // Admin Login via Email
  if (email && password) {
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })

    // Check if user is admin/vendor or specified to allow email login
    if (user.role !== 'admin' && user.role !== 'vendor' && !process.env.ALLOW_USER_EMAIL_LOGIN) {
      return res.status(403).json({ error: 'Please use phone number to login' })
    }

    const ok = await bcrypt.compare(password, user.password!)
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' })

    const secret = process.env.JWT_SECRET || 'secret'
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '7d' })
    return res.json({ token, user: { id: user._id, email: user.email, role: user.role, phone: user.phone, vendorId: user.vendorId } })
  }

  return res.status(400).json({ error: 'Missing credentials' })
})

router.post('/change-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.split(' ')[1]

  try {
    const secret = process.env.JWT_SECRET || 'secret'
    const payload = jwt.verify(token, secret) as any
    const user = await User.findById(payload.userId)
    if (!user || !user.password) return res.status(401).json({ error: 'Unauthorized or password not set' })

    const ok = await bcrypt.compare(oldPassword, user.password)
    if (!ok) return res.status(400).json({ error: 'Invalid old password' })

    const hash = await bcrypt.hash(newPassword, 10)
    user.password = hash
    await user.save()

    return res.json({ message: 'Password changed successfully' })
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
