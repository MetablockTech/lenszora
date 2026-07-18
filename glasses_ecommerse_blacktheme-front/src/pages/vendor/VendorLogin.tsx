import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { Loader2, Store } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth, setToken, setUser } from '@/lib/api'
import { useSettings } from '@/context/SettingsContext'
import { getImageUrl } from '@/lib/utils'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function VendorLogin() {
    const { settings } = useSettings()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true)
        try {
            const data = await auth.login(values.email, values.password)

            if (data.user.role !== 'vendor') {
                toast.error('Access denied. Vendor account required.')
                return
            }

            setToken(data.token)
            localStorage.setItem('userRole', data.user.role) // For VendorLayout compatibility
            setUser(data.user)
            toast.success('Vendor logged in successfully')
            navigate('/vendor/dashboard')
        } catch (error: any) {
            toast.error(error.message || 'Failed to login')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-900/50 rounded-full blur-3xl opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
                        {settings.logoUrl ? (
                            <img
                                src={getImageUrl(settings.logoUrl)}
                                alt={settings.websiteName}
                                className="w-9 h-9 object-contain"
                            />
                        ) : (
                            <Store className="text-white h-7 w-7" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white">Vendor Portal</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your business at {settings.websiteName}</p>
                </div>

                <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Login</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter your vendor credentials to access your dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="vendor@example.com"
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500"
                                    {...form.register('email')}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-400">
                                        {form.formState.errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                                    <Button variant="link" className="px-0 font-normal text-blue-400 h-auto text-xs" onClick={() => toast.info('Please contact support to reset password.')}>
                                        Forgot password?
                                    </Button>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    className="bg-slate-800 border-slate-700 text-white focus:ring-blue-500"
                                    {...form.register('password')}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-400">
                                        {form.formState.errors.password.message}
                                    </p>
                                )}
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 shadow-lg shadow-blue-600/20" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In to Dashboard
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-slate-500">
                        Interested in selling? <Button variant="link" className="p-0 h-auto text-blue-400 font-semibold" onClick={() => navigate('/contact')}>Contact Us</Button>
                    </p>
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-300 text-xs" onClick={() => navigate('/')}>
                        Back to Storefront
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
