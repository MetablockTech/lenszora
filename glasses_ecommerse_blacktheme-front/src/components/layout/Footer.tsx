import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, MapPin, Download } from "lucide-react"
import { categories } from "@/lib/api"
import { useSettings } from "@/context/SettingsContext"

const Footer = () => {
  const { settings } = useSettings()
  const [categoryList, setCategoryList] = useState<any[]>([])

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const data = await categories.list()
      setCategoryList(data.slice(0, 7)) // Show max 7 categories
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const rawName = settings.websiteName || 'LensZora'
  const websiteName = (rawName.includes('.com') || rawName.includes('WWW.') || rawName.includes('buy eyeglasses') || rawName.length > 20) ? 'LensZora' : rawName
  const contactInfo = settings.contactInfo || {}
  const socialLinks = settings.socialLinks || []

  const helpPointLinks = [
    { name: "FAQ (Frequently Asked Questions)", path: "/faq" },
    { name: "Contact Point", path: "/contact" },
    { name: "Track Order", path: "/orders" },
    { name: "Agent Calling", path: `tel:${contactInfo?.phone || "+919876543210"}` },
  ]

  const policyLinks = [
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Terms & Conditions", path: "/terms" },
  ]

  const iconMap: Record<string, any> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
  }

  return (
    <footer className="bg-background border-t border-border/30 overflow-x-hidden">


      {/* Main Footer */}
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/">
              <h2 className="font-playfair text-3xl font-bold mb-4">
                {websiteName}
              </h2>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Premium eyewear for the modern lifestyle. Crafted with precision, designed for clarity.
              Experience the perfect blend of style and vision.
            </p>
            <div className="mb-8">
              <h4 className="font-playfair text-lg font-semibold mb-3">Download Our App</h4>
              <a href="/LensZora.apk" download="LensZora.apk" className="inline-flex items-center gap-3 bg-foreground text-background px-5 py-3 rounded-lg hover:bg-foreground/90 transition-colors group">
                <Download className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Get it on</div>
                  <div className="font-semibold">App Store & Play Store</div>
                </div>
              </a>
            </div>
            <div className="flex gap-4">
              {socialLinks.map((link, index) => {
                const Icon = iconMap[link.icon?.toLowerCase()] || Linkedin
                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.platform}
                    className="w-10 h-10 border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-all duration-300"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-4 text-primary">
              Categories
            </h4>
            <ul className="space-y-3">
              {categoryList.map((category) => (
                <li key={category._id}>
                  <Link
                    to={`/shop?category=${category.slug}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Point */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-4 text-primary">
              Help Point
            </h4>
            <ul className="space-y-3">
              {helpPointLinks.map((link) => (
                <li key={link.path}>
                  {link.path.startsWith("tel:") ? (
                    <a
                      href={link.path}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-4 text-primary">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm">
                  {contactInfo.address}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{contactInfo.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{contactInfo.email}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/30">
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {websiteName}. All rights reserved.
            </p>
            <div className="flex gap-6">
              {policyLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
