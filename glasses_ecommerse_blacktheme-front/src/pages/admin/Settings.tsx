import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Save, Lock, Globe, Mail, Share2, CreditCard } from 'lucide-react'
import { settings, adminAuth, getToken } from '@/lib/api'
import { useSettings } from '@/context/SettingsContext'
import { getImageUrl } from '@/lib/utils'

const SettingsPage: React.FC = () => {
  const { refreshSettings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generalSettings, setGeneralSettings] = useState({
    websiteName: 'LensZora',
    logoUrl: '',
    maintenanceMode: false,
    autoApproveVendorProducts: false
  })
  const [contactInfo, setContactInfo] = useState({
    address: '',
    phone: '',
    email: ''
  })
  const [socialLinks, setSocialLinks] = useState<any[]>([])
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const [general, contact, social, payment] = await Promise.all([
        settings.list('general'),
        settings.get('contact_info').catch(() => ({ value: {} })),
        settings.get('social_links').catch(() => ({ value: [] })),
        settings.get('manual_payment_settings').catch(() => ({ value: { enabled: false, razorpayEnabled: true, upiId: '', qrCode: '', bankDetails: '', instructions: '' } }))
      ])

      const genMap: any = {}
      general.forEach((s: any) => genMap[s.key] = s.value)

      setGeneralSettings({
        websiteName: genMap.websiteName || 'LensZora',
        logoUrl: genMap.logoUrl || '',
        maintenanceMode: genMap.maintenanceMode === true || genMap.maintenanceMode === 'true',
        autoApproveVendorProducts: genMap.autoApproveVendorProducts === true || genMap.autoApproveVendorProducts === 'true'
      })

      setContactInfo(contact.value || { address: '', phone: '', email: '' })
      setSocialLinks(social.value || [])
      setManualPaymentSettings(payment.value || { enabled: false, razorpayEnabled: true, upiId: '', qrCode: '', bankDetails: '', instructions: '' })
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveGeneral() {
    setSaving(true)
    const token = getToken()
    try {
      await Promise.all([
        settings.update('websiteName', { value: generalSettings.websiteName, category: 'general' }, token),
        settings.update('logoUrl', { value: generalSettings.logoUrl, category: 'general' }, token),
        settings.update('maintenanceMode', { value: generalSettings.maintenanceMode, category: 'general', type: 'boolean' }, token),
        settings.update('autoApproveVendorProducts', { value: generalSettings.autoApproveVendorProducts, category: 'general', type: 'boolean' }, token)
      ])
      await refreshSettings()
      toast.success('General settings updated')
    } catch (error) {
      toast.error('Failed to update general settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveContact() {
    setSaving(true)
    const token = getToken()
    try {
      await settings.update('contact_info', { value: contactInfo, category: 'contact' }, token)
      await refreshSettings()
      toast.success('Contact info updated')
    } catch (error) {
      toast.error('Failed to update contact info')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSocial() {
    setSaving(true)
    const token = getToken()
    try {
      await settings.update('social_links', { value: socialLinks, category: 'social' }, token)
      await refreshSettings()
      toast.success('Social links updated')
    } catch (error) {
      toast.error('Failed to update social links')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    const token = getToken()
    try {
      await adminAuth.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      }, token)
      toast.success('Password changed successfully')
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const [manualPaymentSettings, setManualPaymentSettings] = useState({
    enabled: false,
    razorpayEnabled: true,
    upiId: '',
    qrCode: '',
    bankDetails: '',
    instructions: ''
  })
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null)
  const [qrCodePreview, setQrCodePreview] = useState<string>('')

  async function handleSavePayment() {
    setSaving(true)
    const token = getToken()
    try {
      console.log('[DEBUG] Saving payment settings:', manualPaymentSettings)
      
      let finalQrCodeUrl = manualPaymentSettings.qrCode
      if (qrCodeFile) {
        const { url } = await settings.uploadLogo(qrCodeFile, token)
        finalQrCodeUrl = url
      }
      
      const payloadToSave = { ...manualPaymentSettings, qrCode: finalQrCodeUrl }

      await settings.update('manual_payment_settings', { value: payloadToSave, category: 'payment' }, token)
      
      // Update local state and clear file
      setManualPaymentSettings(payloadToSave)
      setQrCodeFile(null)
      setQrCodePreview('')

      await refreshSettings()
      toast.success('Payment settings updated')
      console.log('[DEBUG] Payment settings saved successfully')
    } catch (error) {
      console.error('[DEBUG] Failed to save payment settings:', error)
      toast.error('Failed to update payment settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500">Manage your website configuration and security.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Contact
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Social
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic website information and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="websiteName">Website Name</Label>
                <Input
                  id="websiteName"
                  value={generalSettings.websiteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, websiteName: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <Label>Website Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-lg border bg-slate-50 flex items-center justify-center overflow-hidden">
                    {generalSettings.logoUrl ? (
                      <img
                        src={getImageUrl(generalSettings.logoUrl)}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Globe className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSaving(true)
                          try {
                            const token = getToken()
                            const { url } = await settings.uploadLogo(file, token)
                            setGeneralSettings({ ...generalSettings, logoUrl: url })
                            await refreshSettings()
                            toast.success('Logo uploaded successfully')
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to upload logo')
                          } finally {
                            setSaving(false)
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 200x200px. Max size: 5MB.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, customers will see a maintenance page.
                  </p>
                </div>
                <Switch
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto Approve Vendor Products</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, vendor products will be automatically approved upon submission.
                  </p>
                </div>
                <Switch
                  checked={generalSettings.autoApproveVendorProducts}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, autoApproveVendorProducts: checked })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Manage your store's contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveContact} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Manage your social media presence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Facebook', 'Instagram', 'Twitter', 'Youtube', 'Linkedin'].map((platform) => {
                const link = socialLinks.find((l: any) => l.platform === platform) || { platform, url: '', icon: platform.toLowerCase() }
                return (
                  <div key={platform} className="space-y-2">
                    <Label htmlFor={platform}>{platform}</Label>
                    <Input
                      id={platform}
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...socialLinks]
                        const index = newLinks.findIndex((l: any) => l.platform === platform)
                        if (index > -1) {
                          newLinks[index].url = e.target.value
                        } else {
                          newLinks.push({ platform, url: e.target.value, icon: platform.toLowerCase() })
                        }
                        setSocialLinks(newLinks)
                      }}
                      placeholder={`https://${platform.toLowerCase()}.com/yourprofile`}
                    />
                  </div>
                )
              })}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSocial} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your administrative password.</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Lock className="mr-2 h-4 w-4" /> Change Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure manual payment methods like UPI and Bank Transfer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Manual Payment</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to pay via UPI or Bank Transfer and upload proof.
                  </p>
                </div>
                <Switch
                  checked={manualPaymentSettings.enabled}
                  onCheckedChange={(checked) => setManualPaymentSettings({ ...manualPaymentSettings, enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Razorpay</Label>
                  <p className="text-sm text-muted-foreground">
                    Accept online payments via Razorpay (Cards, Netbanking, UPI).
                  </p>
                </div>
                <Switch
                  checked={manualPaymentSettings.razorpayEnabled}
                  onCheckedChange={(checked) => setManualPaymentSettings({ ...manualPaymentSettings, razorpayEnabled: checked })}
                />
              </div>

              {manualPaymentSettings.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      value={manualPaymentSettings.upiId}
                      onChange={(e) => setManualPaymentSettings({ ...manualPaymentSettings, upiId: e.target.value })}
                      placeholder="e.g. merchant@upi"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>QR Code</Label>
                    <div className="flex items-center gap-6">
                      <div className="h-40 w-40 rounded-lg border bg-slate-50 flex items-center justify-center overflow-hidden">
                        {(qrCodePreview || manualPaymentSettings.qrCode) ? (
                          <img
                            src={qrCodePreview ? qrCodePreview : getImageUrl(manualPaymentSettings.qrCode)}
                            alt="QR Code"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-400 p-2 text-xs">
                            Upload QR Code
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setQrCodeFile(file)
                              setQrCodePreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload your UPI QR Code image.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankDetails">Bank Details</Label>
                    <textarea
                      id="bankDetails"
                      value={manualPaymentSettings.bankDetails}
                      onChange={(e) => setManualPaymentSettings({ ...manualPaymentSettings, bankDetails: e.target.value })}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Bank Name: Example Bank&#10;Account No: 1234567890&#10;IFSC: EXBK0001234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions for User</Label>
                    <textarea
                      id="instructions"
                      value={manualPaymentSettings.instructions}
                      onChange={(e) => setManualPaymentSettings({ ...manualPaymentSettings, instructions: e.target.value })}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Please transfer the total amount to the above details and attach the screenshot."
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePayment} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  )
}

export default SettingsPage
