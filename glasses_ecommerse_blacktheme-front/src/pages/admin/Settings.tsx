import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, Save, Lock, Globe, Mail, Share2, CreditCard, Eye, EyeOff, FileText } from 'lucide-react'
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
    autoApproveVendorProducts: false,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.lenszora.app'
  })
  const [contactInfo, setContactInfo] = useState({
    address: '',
    phone: '',
    email: ''
  })
  const [socialLinks, setSocialLinks] = useState<any[]>([])
  const [legalSettings, setLegalSettings] = useState({
    privacyPolicy: '',
    termsAndConditions: ''
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

function stripHtmlToCleanText(html: string): string {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;

  let text = html;
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1');
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1');
  text = text.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  return text.trim();
}

const DEFAULT_PRIVACY_POLICY = `Last Updated: September 2026

1. Information We Collect
At LensZora, we prioritize your privacy and are committed to protecting your personal information. When you use our platform, we collect:
• Personal Information: Full name, email address, phone number, and delivery addresses.
• Optical & Eye Power Details: Prescription values (SPH, CYL, AXIS, ADD, PD) and uploaded prescription documents/photos.
• Payment Details: Encrypted payment metadata (transactions processed securely via PCI-DSS compliant payment gateways).
• Usage & Device Data: IP address, browser type, and interactions with our store.

2. How We Use Your Data
Your data enables us to provide a seamless optical shopping experience, including:
• Custom crafting and quality testing your prescription optical lenses.
• Processing payments and fulfilling orders accurately.
• Providing real-time order updates via SMS, WhatsApp, and Email.
• Continuous optimization of user interface and store recommendations.

3. Prescription Data Security
All uploaded eye test prescriptions and manual power entries are strictly accessible only by authorized optical technicians and stored with AES-256 encryption.

4. Third-Party Services
We share necessary order details only with verified logistics partners (couriers) and certified payment processors. We NEVER sell or rent your personal information to third-party advertisers.

5. Contact Us Regarding Privacy
If you have any questions or data requests, contact our privacy team at support@lenszora.com.`;

const DEFAULT_TERMS = `Last Updated: September 2026

1. Acceptance of Terms
By accessing and placing an order on LensZora, you agree to comply with these Terms & Conditions. Please read them carefully before making a purchase.

2. Optical Prescription Accuracy
Customers ordering prescription lenses are responsible for providing valid and accurate eye test values. LensZora will manufacture lenses precisely according to the numerical values or prescription images submitted by the customer.

3. Pricing & Payments
All product prices on LensZora are displayed inclusive of applicable taxes unless specified otherwise. We reserve the right to modify prices or cancel orders in case of typographical pricing errors.

4. Shipping & Delivery
Orders are dispatched after optical fitting and quality verification. Delivery timelines may vary based on pin code accessibility and prescription customization requirements.

5. Returns & Warranty
Frame damage and lens manufacturing defects are covered under LensZora warranty policies. Returns must meet our return criteria as detailed in the Return Policy.

6. Customer Support
For any queries, contact our support desk at support@lenszora.com.`;

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const [general, contact, social, payment, privacy, terms] = await Promise.all([
        settings.list('general'),
        settings.get('contact_info').catch(() => ({ value: {} })),
        settings.get('social_links').catch(() => ({ value: [] })),
        settings.get('manual_payment_settings').catch(() => ({ value: { enabled: false, razorpayEnabled: true, upiId: '', qrCode: '', bankDetails: '', instructions: '' } })),
        settings.get('privacy_policy').catch(() => ({ value: '' })),
        settings.get('terms_and_conditions').catch(() => ({ value: '' }))
      ])

      const genMap: any = {}
      general.forEach((s: any) => genMap[s.key] = s.value)

      setGeneralSettings({
        websiteName: genMap.websiteName || 'LensZora',
        logoUrl: genMap.logoUrl || '',
        maintenanceMode: genMap.maintenanceMode === true || genMap.maintenanceMode === 'true',
        autoApproveVendorProducts: genMap.autoApproveVendorProducts === true || genMap.autoApproveVendorProducts === 'true',
        playStoreUrl: genMap.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.lenszora.app'
      })

      setContactInfo(contact.value || { address: '', phone: '', email: '' })
      setSocialLinks(social.value || [])
      setManualPaymentSettings(payment.value || { enabled: false, razorpayEnabled: true, upiId: '', qrCode: '', bankDetails: '', instructions: '' })
      
      const cleanPrivacy = stripHtmlToCleanText(privacy.value || '')
      const cleanTerms = stripHtmlToCleanText(terms.value || '')

      setLegalSettings({
        privacyPolicy: (cleanPrivacy && cleanPrivacy.length > 0) ? cleanPrivacy : DEFAULT_PRIVACY_POLICY,
        termsAndConditions: (cleanTerms && cleanTerms.length > 0) ? cleanTerms : DEFAULT_TERMS
      })
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
        settings.update('autoApproveVendorProducts', { value: generalSettings.autoApproveVendorProducts, category: 'general', type: 'boolean' }, token),
        settings.update('playStoreUrl', { value: generalSettings.playStoreUrl, category: 'general' }, token)
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
      
      await refreshSettings()
      toast.success('Payment settings updated')
    } catch (error) {
      toast.error('Failed to update payment settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveLegal() {
    setSaving(true)
    const token = getToken()
    try {
      await Promise.all([
        settings.update('privacy_policy', { value: legalSettings.privacyPolicy, category: 'legal' }, token),
        settings.update('terms_and_conditions', { value: legalSettings.termsAndConditions, category: 'legal' }, token),
      ])
      await refreshSettings()
      toast.success('Legal & Policy pages updated')
    } catch (error) {
      toast.error('Failed to update Legal & Policy pages')
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
            <Lock className="h-4 w-4 text-amber-500" /> Change Password
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" /> Legal & Policies
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
              <div className="space-y-2 pt-2">
                <Label htmlFor="playStoreUrl">Google Play Store App URL</Label>
                <Input
                  id="playStoreUrl"
                  value={generalSettings.playStoreUrl}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, playStoreUrl: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=com.lenszora.app"
                />
                <p className="text-xs text-muted-foreground">App download buttons across website topbar, footer & mobile drawer will navigate users to this Play Store URL.</p>
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
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" /> Change Password
              </CardTitle>
              <CardDescription>Update your admin account login password.</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password *</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      required
                      placeholder="Enter current password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Enter new password (min 6 characters)"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Re-enter new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordData.newPassword && passwordData.confirmPassword && (
                    <p className={`text-xs font-medium mt-1 ${passwordData.newPassword === passwordData.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                      {passwordData.newPassword === passwordData.confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={saving || !passwordData.oldPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Lock className="mr-2 h-4 w-4" /> Update Password
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

        <TabsContent value="legal">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold">Legal & Policy Pages</CardTitle>
                <CardDescription className="mt-1">
                  Edit and customize the Privacy Policy and Terms & Conditions content displayed on your store.
                </CardDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1"
                >
                  Preview Privacy Page ↗
                </a>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1"
                >
                  Preview Terms Page ↗
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="privacyPolicy" className="font-bold text-slate-900 text-sm">
                    Privacy Policy Content (HTML / Text)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLegalSettings(prev => ({ ...prev, privacyPolicy: DEFAULT_PRIVACY_POLICY }))
                      toast.info('Privacy Policy form reset to default template')
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 h-7 px-2"
                  >
                    Reset Default Template
                  </Button>
                </div>
                <textarea
                  id="privacyPolicy"
                  rows={12}
                  value={legalSettings.privacyPolicy}
                  onChange={(e) => setLegalSettings({ ...legalSettings, privacyPolicy: e.target.value })}
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 font-mono text-slate-800 leading-relaxed shadow-sm"
                  placeholder="Enter HTML or plain text content for Privacy Policy page..."
                />
                <p className="text-xs text-slate-500">HTML tags (&lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;) are supported for rich formatting.</p>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="termsAndConditions" className="font-bold text-slate-900 text-sm">
                    Terms & Conditions Content (HTML / Text)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLegalSettings(prev => ({ ...prev, termsAndConditions: DEFAULT_TERMS }))
                      toast.info('Terms & Conditions form reset to default template')
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 h-7 px-2"
                  >
                    Reset Default Template
                  </Button>
                </div>
                <textarea
                  id="termsAndConditions"
                  rows={12}
                  value={legalSettings.termsAndConditions}
                  onChange={(e) => setLegalSettings({ ...legalSettings, termsAndConditions: e.target.value })}
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 font-mono text-slate-800 leading-relaxed shadow-sm"
                  placeholder="Enter HTML or plain text content for Terms & Conditions page..."
                />
                <p className="text-xs text-slate-500">HTML tags (&lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;) are supported for rich formatting.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">Changes will reflect instantly on live website upon saving.</span>
              <Button onClick={handleSaveLegal} disabled={saving} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-md">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Legal Policies
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage
