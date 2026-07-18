import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>

                <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground mb-6">
                        Last Updated: December 30, 2024
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground mb-4">
                            By accessing and using Visionary Emporium, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                        <p className="text-muted-foreground mb-4">
                            Permission is granted to temporarily download one copy of the materials on Visionary Emporium for personal, non-commercial transitory viewing only.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>This is the grant of a license, not a transfer of title</li>
                            <li>You may not modify or copy the materials</li>
                            <li>You may not use the materials for any commercial purpose</li>
                            <li>You may not attempt to decompile or reverse engineer any software</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. Product Information</h2>
                        <p className="text-muted-foreground mb-4">
                            We strive to provide accurate product information. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Pricing</h2>
                        <p className="text-muted-foreground mb-4">
                            All prices are subject to change without notice. We reserve the right to modify or discontinue products without prior notification.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. User Accounts</h2>
                        <p className="text-muted-foreground mb-4">
                            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
                        <p className="text-muted-foreground mb-4">
                            Visionary Emporium shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
                        <p className="text-muted-foreground">
                            For questions about these Terms & Conditions, please contact us at support@visionaryemporium.com
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
