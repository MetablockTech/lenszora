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
    { name: "Customer Support & Assistance", path: "/support" },
    { name: "FAQ (Frequently Asked Questions)", path: "/faq" },
    { name: "Contact Point", path: "/contact" },
    { name: "Track Order", path: "/orders" },
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
    <footer className="bg-background border-t border-border/30 overflow-x-hidden pb-16 md:pb-0">


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
              <h4 className="font-playfair text-lg font-semibold mb-3 text-gold">Experience LensZora App</h4>
              <p className="text-xs text-slate-400 mb-3">Download our official app on Play Store for exclusive discounts.</p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={settings?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.lenszora.app'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-zinc-900 border border-white/20 hover:border-gold/60 text-white px-4 py-2.5 rounded-xl transition-all duration-300 group shadow-lg cursor-pointer hover:scale-105"
                >
                  <svg className="h-6 w-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 0 1-.61-1.614V3.428c0-.623.224-1.196.609-1.614z" fill="#00E676"/>
                    <path d="M17.438 8.354l-3.646 3.646 3.646 3.646 4.14-2.366c.866-.495.866-1.966 0-2.461l-4.14-2.465z" fill="#FFD54F"/>
                    <path d="M3.61 1.814l10.182 10.186L17.438 8.354 5.922 1.785A2.35 2.35 0 0 0 3.61 1.814z" fill="#FF1744"/>
                    <path d="M3.61 22.186a2.35 2.35 0 0 0 2.312-.029l11.516-6.569-3.646-3.646L3.61 22.186z" fill="#2979FF"/>
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">GET IT ON</div>
                    <div className="font-bold text-xs sm:text-sm text-white group-hover:text-gold">Google Play</div>
                  </div>
                </a>
              </div>
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
