import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy - MiniEmployee</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, such as when you create an account,
              use our services, or contact us for support. This includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Account information (email, name)</li>
              <li>Payment information (processed by LemonSqueezy)</li>
              <li>Task descriptions and results</li>
              <li>Vault credentials (encrypted)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate security measures to protect your personal information.
              Vault credentials are encrypted using industry-standard encryption.
              We never store or log the actual values of your secrets.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as your account is active or as needed
              to provide you services. You can request deletion of your account and associated
              data at any time through the settings page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at
              privacy@miniemployee.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
