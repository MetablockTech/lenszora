import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Phone, ShieldCheck, Gift, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auth, referrals, setToken, setUser, getStoredReferralCode, clearStoredReferralCode } from '@/lib/api'

const phoneSchema = z.object({
    phone: z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number'),
})

const otpSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
})

export default function AuthPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const redirect = searchParams.get('redirect') || '/'
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<'phone' | 'otp'>('phone')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)
    const [referralCode, setReferralCode] = useState(() => (searchParams.get('ref') || getStoredReferralCode()).trim().toUpperCase())
    const [showReferral, setShowReferral] = useState(() => !!referralCode)
    const [referralStatus, setReferralStatus] = useState<{
        state: 'idle' | 'checking' | 'valid' | 'invalid'
        referrerName?: string
        error?: string
    }>({ state: 'idle' })

    const phoneForm = useForm<z.infer<typeof phoneSchema>>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phone: '' },
    })

    const otpForm = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: '' },
    })

    useEffect(() => {
        let timer: any
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(timer)
    }, [resendCooldown])

    // Validate the referral code as the user types (debounced)
    useEffect(() => {
        const code = referralCode.trim()
        if (!code) {
            setReferralStatus({ state: 'idle' })
            return
        }
        setReferralStatus({ state: 'checking' })
        let cancelled = false
        const timer = setTimeout(async () => {
            try {
                const result = await referrals.validate(code)
                if (cancelled) return
                setReferralStatus(result.valid
                    ? { state: 'valid', referrerName: result.referrerName }
                    : { state: 'invalid', error: result.error || 'Invalid referral code' })
            } catch {
                if (!cancelled) setReferralStatus({ state: 'invalid', error: 'Could not check referral code' })
            }
        }, 400)
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [referralCode])

    async function onSendOTP(values: z.infer<typeof phoneSchema>) {
        if (referralCode.trim() && referralStatus.state !== 'valid') {
            toast.error(referralStatus.state === 'checking'
                ? 'Checking referral code, please wait'
                : 'Please fix or remove the referral code')
            return
        }
        setIsLoading(true)
        try {
            await auth.sendOTP(values.phone)
            setPhoneNumber(values.phone)
            setStep('otp')
            otpForm.setValue('otp', '123456')
            setResendCooldown(30)
            toast.success('OTP sent! Use fixed OTP: 123456')
        } catch (error: any) {
            console.error('OTP Send Error:', error)
            toast.error(error.message || 'Failed to send OTP')
        } finally {
            setIsLoading(false)
        }
    }

    async function onVerifyOTP(values: z.infer<typeof otpSchema>) {
        setIsLoading(true)
        try {
            const code = referralStatus.state === 'valid' ? referralCode.trim() : undefined
            const data = await auth.verifyOTP(phoneNumber, values.otp, code)
            setToken(data.token)
            setUser(data.user)
            toast.success('Authenticated successfully')
            if (data.referral?.applied) {
                toast.success(`Referral applied! You were invited by ${data.referral.referrerName}`)
            } else if (code && data.referral?.error) {
                toast.info(`Referral not applied: ${data.referral.error}`)
            }
            clearStoredReferralCode()
            navigate(redirect)
        } catch (error: any) {
            toast.error(error.message || 'Invalid OTP')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleResend() {
        if (resendCooldown > 0) return
        setIsLoading(true)
        try {
            await auth.sendOTP(phoneNumber)
            otpForm.setValue('otp', '123456')
            setResendCooldown(30)
            toast.success('OTP resent! Use fixed OTP: 123456')
        } catch (error: any) {
            console.error('Resend OTP Error:', error)
            toast.error(error.message || 'Failed to resend OTP')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center py-12 px-4 bg-slate-950">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-primary/20 shadow-xl bg-slate-900 text-white">
                        <CardHeader className="space-y-1 text-center">
                            <AnimatePresence mode="wait">
                                {step === 'phone' ? (
                                    <motion.div
                                        key="phone-header"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                            <Phone className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle className="text-2xl">Login or Register</CardTitle>
                                        <CardDescription className="text-slate-400">
                                            Enter any mobile number to continue
                                        </CardDescription>
                                        {referralStatus.state === 'valid' && (
                                            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                                                <Gift className="h-4 w-4 shrink-0" />
                                                <span><span className="font-bold">{referralStatus.referrerName}</span> invited you to LensZora</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="otp-header"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                            <ShieldCheck className="h-6 w-6 text-green-500" />
                                        </div>
                                        <CardTitle className="text-2xl">Verify OTP</CardTitle>
                                        <CardDescription className="text-slate-400">
                                            Code for {phoneNumber} (Fixed OTP: <span className="font-bold text-amber-400">123456</span>)
                                        </CardDescription>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardHeader>
                        <CardContent>
                            <AnimatePresence mode="wait">
                                {step === 'phone' ? (
                                    <motion.form
                                        key="phone-form"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={phoneForm.handleSubmit(onSendOTP)} 
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Mobile Number</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400">+91</span>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="9876543210"
                                                    className="pl-12 bg-slate-800 border-slate-700"
                                                    {...phoneForm.register('phone')}
                                                />
                                            </div>
                                            {phoneForm.formState.errors.phone && (
                                                <p className="text-sm text-destructive">
                                                    {phoneForm.formState.errors.phone.message}
                                                </p>
                                            )}
                                        </div>
                                        {showReferral ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="referral">Referral Code (optional)</Label>
                                                <Input
                                                    id="referral"
                                                    type="text"
                                                    placeholder="LZ-XXXXXX"
                                                    value={referralCode}
                                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                                    className="uppercase tracking-wider bg-slate-800 border-slate-700"
                                                />
                                                {referralStatus.state === 'checking' && (
                                                    <p className="flex items-center gap-1.5 text-sm text-slate-400">
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking code...
                                                    </p>
                                                )}
                                                {referralStatus.state === 'valid' && (
                                                    <p className="flex items-center gap-1.5 text-sm text-green-400">
                                                        <CheckCircle2 className="h-4 w-4" /> Invited by {referralStatus.referrerName}
                                                    </p>
                                                )}
                                                {referralStatus.state === 'invalid' && (
                                                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                                                        <XCircle className="h-4 w-4" /> {referralStatus.error}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowReferral(true)}
                                                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                            >
                                                <Gift className="h-4 w-4" /> Have a referral code?
                                            </button>
                                        )}
                                        <Button type="submit" className="w-full btn-gold" disabled={isLoading}>
                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Get OTP
                                        </Button>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        key="otp-form"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        onSubmit={otpForm.handleSubmit(onVerifyOTP)} 
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="otp">Enter 6-digit OTP</Label>
                                            <Input
                                                id="otp"
                                                type="text"
                                                maxLength={6}
                                                placeholder="123456"
                                                className="tracking-[1em] text-center text-xl bg-slate-800 border-slate-700"
                                                {...otpForm.register('otp')}
                                                autoFocus
                                            />
                                            {otpForm.formState.errors.otp && (
                                                <p className="text-sm text-destructive text-center">
                                                    {otpForm.formState.errors.otp.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <Button type="submit" className="w-full btn-gold" disabled={isLoading}>
                                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Verify & Continue
                                            </Button>
                                            <div className="flex justify-between items-center text-sm px-1">
                                                <button 
                                                    type="button" 
                                                    className="text-primary hover:underline"
                                                    onClick={() => setStep('phone')}
                                                >
                                                    Change Number
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className={`hover:underline ${resendCooldown > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-primary'}`}
                                                    onClick={handleResend}
                                                    disabled={resendCooldown > 0 || isLoading}
                                                >
                                                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>

            <Footer />
        </div>
    )
}
