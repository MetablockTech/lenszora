import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { getToken, API_URL } from "@/lib/api"

export default function ContactInfoPage() {
    const [loading, setLoading] = useState(true)
    const [contactInfo, setContactInfo] = useState({
        address: '',
        phone: '',
        email: ''
    })

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/api/settings/contact_info`)

            if (res.ok) {
                const data = await res.json()
                if (data.value) {
                    setContactInfo(data.value)
                }
            }
        } catch (error) {
            console.error('Failed to load contact info:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        try {
            const token = getToken()

            const res = await fetch(`${API_URL}/api/settings/contact_info`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    value: contactInfo,
                    type: 'json',
                    category: 'general',
                    description: 'Contact information'
                })
            })

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(errorText || `Failed to save (${res.status})`)
            }

            toast({
                title: "Success",
                description: "Contact information saved successfully"
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save contact information",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-700 rounded w-1/4"></div>
                    <div className="h-64 bg-slate-700 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Contact Information</h1>
                <p className="text-slate-500 mt-1">Manage your store's contact details</p>
            </div>

            <Card className="bg-card border-border max-w-2xl">
                <CardHeader>
                    <CardTitle>Store Contact Details</CardTitle>
                </CardHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={contactInfo.address}
                                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                                    placeholder="123 Shopping Street, City, State - PIN"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={contactInfo.phone}
                                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                    placeholder="+91 1234567890"
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={contactInfo.email}
                                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                    placeholder="support@yourstore.com"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <div className="p-6 pt-0 flex justify-start">
                        <Button type="submit" className="btn-gold">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
