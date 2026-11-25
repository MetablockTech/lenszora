import { useState } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Mail, MapPin, Phone, CheckCircle2, Loader2 } from "lucide-react"
import { useSettings } from "@/context/SettingsContext"
import { contactMessages, getUser } from "@/lib/api"

const inputClass = "w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"

export default function ContactPage() {
    const { settings } = useSettings()
    const contactInfo: { email?: string; phone?: string; address?: string } = settings.contactInfo || {}
    const email = contactInfo.email || "support@lenszora.com"
    const phone = contactInfo.phone || ""
    const user = getUser()

    const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", subject: "", message: "" })
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState("")

    const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }))

    // Sends the message to the admin panel (Admin → Contact Messages)
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            setError("Please fill in your name, email and message.")
            return
        }
        setSending(true)
        try {
            await contactMessages.send(form)
            setSent(true)
            setForm((f) => ({ ...f, subject: "", message: "" }))
        } catch (err: any) {
            setError(err?.message || "Could not send your message. Please try again.")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
                        <p className="text-muted-foreground mb-8">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Email</h3>
                                    <a href={`mailto:${email}`} className="text-muted-foreground hover:text-primary">{email}</a>
                                </div>
                            </div>

                            {phone && (
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <Phone className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Phone</h3>
                                        <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-muted-foreground hover:text-primary">{phone}</a>
                                    </div>
                                </div>
                            )}

                            {contactInfo.address && (
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Address</h3>
                                        <p className="text-muted-foreground whitespace-pre-line">{contactInfo.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-8">
                        <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
                        {sent ? (
                            <div className="flex flex-col items-center text-center gap-3 py-10">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                <p className="text-lg font-semibold">Thanks! Your message has been sent.</p>
                                <p className="text-sm text-muted-foreground">Our team will get back to you at {form.email || "your email"} soon.</p>
                                <button type="button" onClick={() => setSent(false)} className="mt-2 text-sm font-semibold text-primary hover:underline">
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                <div>
                                    <label className="block text-sm font-medium mb-2" htmlFor="contact-name">Name *</label>
                                    <input id="contact-name" type="text" value={form.name} onChange={set("name")} maxLength={120} className={inputClass} placeholder="Your name" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" htmlFor="contact-email">Email *</label>
                                        <input id="contact-email" type="email" value={form.email} onChange={set("email")} maxLength={200} className={inputClass} placeholder="your@email.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2" htmlFor="contact-phone">Phone</label>
                                        <input id="contact-phone" type="tel" value={form.phone} onChange={set("phone")} maxLength={20} className={inputClass} placeholder="Optional" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" htmlFor="contact-subject">Subject</label>
                                    <input id="contact-subject" type="text" value={form.subject} onChange={set("subject")} maxLength={200} className={inputClass} placeholder="How can we help?" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" htmlFor="contact-message">Message *</label>
                                    <textarea id="contact-message" rows={5} value={form.message} onChange={set("message")} maxLength={5000} className={inputClass} placeholder="Your message..." />
                                </div>

                                {error && <p className="text-sm text-red-500">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                                >
                                    {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {sending ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
