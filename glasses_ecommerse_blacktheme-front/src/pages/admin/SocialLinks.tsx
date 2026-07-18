import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { getToken, API_URL } from "@/lib/api"

const FIXED_PLATFORMS = [
    { platform: 'Facebook', icon: 'facebook' },
    { platform: 'Instagram', icon: 'instagram' },
    { platform: 'Twitter', icon: 'twitter' },
    { platform: 'Youtube', icon: 'youtube' },
    { platform: 'LinkedIn', icon: 'linkedin' },
]

export default function SocialLinksPage() {
    const [loading, setLoading] = useState(true)
    const [socialLinks, setSocialLinks] = useState(
        FIXED_PLATFORMS.map(p => ({ ...p, url: '' }))
    )

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/api/settings/social_links`)

            if (res.ok) {
                const data = await res.json()
                if (data.value && Array.isArray(data.value)) {
                    // Merge saved URLs with fixed platforms
                    const merged = FIXED_PLATFORMS.map(platform => {
                        const saved = data.value.find((s: any) => s.icon === platform.icon)
                        return {
                            ...platform,
                            url: saved?.url || ''
                        }
                    })
                    setSocialLinks(merged)
                }
            }
        } catch (error) {
            console.error('Failed to load social links:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        try {
            const token = getToken()

            const res = await fetch(`${API_URL}/api/settings/social_links`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    value: socialLinks,
                    type: 'array',
                    category: 'social',
                    description: 'Social media links'
                })
            })

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(errorText || `Failed to save (${res.status})`)
            }

            toast({
                title: "Success",
                description: "Social links saved successfully"
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save social links",
                variant: "destructive"
            })
        }
    }

    function updateLink(index: number, url: string) {
        const updated = [...socialLinks]
        updated[index].url = url
        setSocialLinks(updated)
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
                <h1 className="text-3xl font-bold text-slate-900">Social Links</h1>
                <p className="text-slate-500 mt-1">Manage your social media links</p>
            </div>

            <Card className="bg-card border-border max-w-4xl">
                <CardHeader>
                    <CardTitle>Social Media Platforms</CardTitle>
                </CardHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <CardContent>
                        <div className="space-y-4">
                            {socialLinks.map((link, index) => (
                                <div key={link.icon} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Platform</Label>
                                        <Input
                                            value={link.platform}
                                            disabled
                                            className="bg-secondary/50"
                                        />
                                    </div>
                                    <div>
                                        <Label>URL</Label>
                                        <Input
                                            value={link.url}
                                            onChange={(e) => updateLink(index, e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            ))}
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
