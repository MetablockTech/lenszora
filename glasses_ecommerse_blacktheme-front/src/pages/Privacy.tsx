import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

                <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground mb-6">
                        Last Updated: December 30, 2024
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                        <p className="text-muted-foreground mb-4">
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Name, email address, and contact information</li>
                            <li>Shipping and billing addresses</li>
                            <li>Payment information</li>
                            <li>Order history and preferences</li>
                            <li>Communications with customer service</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                        <p className="text-muted-foreground mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Process and fulfill your orders</li>
                            <li>Communicate with you about your orders</li>
                            <li>Send you marketing communications (with your consent)</li>
                            <li>Improve our products and services</li>
                            <li>Prevent fraud and enhance security</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
                        <p className="text-muted-foreground mb-4">
                            We do not sell your personal information. We may share your information with:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Service providers who assist in our operations</li>
                            <li>Payment processors for transaction handling</li>
                            <li>Shipping partners for order delivery</li>
                            <li>Legal authorities when required by law</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Cookies and Tracking</h2>
                        <p className="text-muted-foreground mb-4">
                            We use cookies and similar tracking technologies to improve your browsing experience, analyze site traffic, and personalize content.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
                        <p className="text-muted-foreground mb-4">
                            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                        <p className="text-muted-foreground mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Data portability</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
                        <p className="text-muted-foreground">
                            For privacy-related questions or concerns, contact us at privacy@visionaryemporium.com
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
