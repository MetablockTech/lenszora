import { User, IUser } from '../models/User'
import { Order } from '../models/Order'

export function normalizeReferralCode(code: unknown) {
  return typeof code === 'string' ? code.trim().toUpperCase() : ''
}

// Public-safe label for a referrer: their name, or a masked phone number
export function referrerDisplayName(referrer: Pick<IUser, 'name' | 'phone'>) {
  if (referrer.name?.trim()) return referrer.name.trim().split(/\s+/)[0]
  const digits = (referrer.phone || '').replace(/\D/g, '').slice(-10)
  return digits.length >= 6 ? `${digits.slice(0, 2)}******${digits.slice(-2)}` : 'a LensZora member'
}

export async function findReferrerByCode(code: unknown) {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return null
  return User.findOne({ referralCode: normalized }).select('name phone referralCode')
}

/**
 * Link a verified user to the owner of `code`.
 * Only applies to users who have no referrer yet and have never placed an order.
 */
export async function applyReferral(user: IUser, code: unknown) {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return { applied: false }

  if (user.referredBy) return { applied: false, error: 'A referral code is already linked to this account' }
  if (user.referralCode === normalized) return { applied: false, error: 'You cannot use your own referral code' }

  const hasOrders = user.hasPlacedFirstOrder || await Order.exists({ userId: user._id })
  if (hasOrders) return { applied: false, error: 'Referral codes can only be used before your first order' }

  const referrer = await findReferrerByCode(normalized)
  if (!referrer) return { applied: false, error: 'Invalid referral code' }
  if (referrer._id.equals(user._id)) return { applied: false, error: 'You cannot use your own referral code' }

  user.referredBy = referrer._id
  await User.updateOne({ _id: referrer._id }, { $inc: { referralCount: 1 } })

  return { applied: true, referrerName: referrerDisplayName(referrer) }
}
