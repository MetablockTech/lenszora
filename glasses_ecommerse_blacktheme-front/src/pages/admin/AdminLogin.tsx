import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { Loader2, Lock } from 'lucide-react'
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

export default function AdminLogin() {
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

            if (data.user.role !== 'admin') {
                toast.error('Access denied. Admin privileges required.')
                return
            }

            setToken(data.token)
            setUser(data.user)
            toast.success('Admin logged in successfully')
            navigate('/admin/dashboard')
        } catch (error: any) {
            toast.error(error.message || 'Failed to login')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 overflow-hidden">
                        {settings.logoUrl ? (
                            <img
                                src={getImageUrl(settings.logoUrl)}
                                alt={settings.websiteName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <Lock className="text-white h-6 w-6" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white">{settings.websiteName} Admin</h1>
                    <p className="text-slate-400 text-sm mt-1">Secure Administrative Access</p>
                </div>

                <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter your admin credentials to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={`admin@${settings.websiteName.toLowerCase().replace(/\s+/g, '')}.com`}
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
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
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
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Access Dashboard
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Button variant="link" className="text-slate-500 hover:text-slate-300 text-sm" onClick={() => navigate('/')}>
                        Back to Storefront
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
