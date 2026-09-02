import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { AuthRequest } from './auth'

export { AuthRequest }

export const vendorAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return res.status(401).json({ message: 'No authentication token provided' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production') as any
        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        if (user.role !== 'vendor') {
            return res.status(403).json({ message: 'Access denied. Vendor role required.' })
        }

        if (!user.vendorId) {
            return res.status(403).json({ message: 'Vendor profile not found' })
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            vendorId: user.vendorId.toString()
        }

        next()
    } catch (error) {
        res.status(401).json({ message: 'Invalid authentication token' })
    }
}

export const adminOrVendorAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return res.status(401).json({ message: 'No authentication token provided' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production') as any
        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        if (user.role !== 'vendor' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Vendor or Admin role required.' })
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            vendorId: user.vendorId?.toString()
        }

        next()
    } catch (error) {
        res.status(401).json({ message: 'Invalid authentication token' })
    }
}
