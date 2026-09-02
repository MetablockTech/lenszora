import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X } from 'lucide-react'
import { returnRequests, products, getToken } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'

interface ReturnRequestModalProps {
    isOpen: boolean
    onClose: () => void
    orderId: string
    productId: string
    variantSku?: string
    productTitle: string
    onSuccess: () => void
}

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
    isOpen, onClose, orderId, productId, variantSku, productTitle, onSuccess
}) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [step, setStep] = useState<'policy-check' | 'form'>('policy-check')
    const [policy, setPolicy] = useState<any>(null)
    const [checkingPolicy, setCheckingPolicy] = useState(false)

    // Form state
    const [requestType, setRequestType] = useState<string>('return')
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [images, setImages] = useState<string[]>([])

    // Check policy when modal opens
    React.useEffect(() => {
        if (isOpen) {
            checkPolicy()
        }
    }, [isOpen, productId])

    async function checkPolicy() {
        setCheckingPolicy(true)
        try {
            const product = await products.get(productId)
            setPolicy(product.returnPolicy || {
                allowReturns: true,
                allowRefunds: true,
                returnPeriodDays: 14
            })
            setStep('policy-check')
        } catch (error) {
            console.error(error)
            toast({ title: "Error checking return policy", variant: "destructive" })
            onClose()
        } finally {
            setCheckingPolicy(false)
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const token = getToken()
        try {
            const newImages = []
            for (let i = 0; i < files.length; i++) {
                const res = await returnRequests.uploadProof(files[i], token || undefined)
                const imgUrl = res.url || res.path
                if (imgUrl) newImages.push(imgUrl)
            }
            setImages([...images, ...newImages])
        } catch (error: any) {
            toast({ title: "Upload failed", description: error?.message || "Could not upload image", variant: "destructive" })
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!reason) {
            toast({ title: "Please select a reason", variant: "destructive" })
            return
        }

        setLoading(true)
        const token = getToken()
        try {
            await returnRequests.create({
                orderId,
                productId,
                variantSku,
                requestType,
                reason,
                description,
                images
            }, token)

            toast({ title: "Request submitted successfully" })
            onSuccess()
            onClose()
        } catch (error: any) {
            toast({
                title: "Submission failed",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    if (checkingPolicy) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const isEligible = policy?.allowReturns || policy?.allowRefunds

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Return/Refund Request</DialogTitle>
                    <DialogDescription>
                        {productTitle}
                    </DialogDescription>
                </DialogHeader>

                {step === 'policy-check' ? (
                    <div className="space-y-4 py-4">
                        {isEligible ? (
                            <>
                                <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                                    <h4 className="font-semibold text-sm">Return Policy</h4>
                                    <ul className="text-sm space-y-1 text-slate-600 list-disc list-inside">
                                        <li>Returns Allowed: {policy.allowReturns ? 'Yes' : 'No'}</li>
                                        <li>Refunds Allowed: {policy.allowRefunds ? 'Yes' : 'No'}</li>
                                        <li>Return Period: {policy.returnPeriodDays} days</li>
                                        {policy.policyText && <li>{policy.policyText}</li>}
                                    </ul>
                                </div>
                                <Button className="w-full" onClick={() => setStep('form')}>
                                    Proceed with Request
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <p className="text-red-600 font-medium">This item is not eligible for return or refund according to the seller's policy.</p>
                                <Button variant="outline" onClick={onClose}>Close</Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Request Type</Label>
                            <Select value={requestType} onValueChange={setRequestType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {policy?.allowReturns && <SelectItem value="return">Return Item</SelectItem>}
                                    {policy?.allowRefunds && <SelectItem value="refund">Request Refund</SelectItem>}
                                    {policy?.allowReturns && <SelectItem value="exchange">Exchange Item</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="defective">Defective/Damaged Product</SelectItem>
                                    <SelectItem value="wrong_item">Received Wrong Item</SelectItem>
                                    <SelectItem value="not_as_described">Not as Described</SelectItem>
                                    <SelectItem value="size_issue">Size Fit Issue</SelectItem>
                                    <SelectItem value="quality_issue">Quality Not Satisfactory</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Please describe the issue in detail..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Proof Images (Optional)</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {images.map((img, i) => (
                                    <div key={i} className="relative w-16 h-16 border rounded overflow-hidden group">
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-slate-400" />}
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setStep('policy-check')}>Back</Button>
                            <Button type="submit" disabled={loading || uploading}>
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default ReturnRequestModal
