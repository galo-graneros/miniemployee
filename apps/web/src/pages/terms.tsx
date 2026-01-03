import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service - MiniEmployee</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using MiniEmployee, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              MiniEmployee provides AI-powered browser automation services. Our AI agents can
              perform tasks on websites on your behalf, including but not limited to form filling,
              data extraction, and navigation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="text-muted-foreground">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Maintaining the security of your account</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your use complies with applicable laws</li>
              <li>Not using the service for illegal or unauthorized purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Prohibited Uses</h2>
            <p className="text-muted-foreground">
              You may not use our service to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute malware or harmful code</li>
              <li>Engage in unauthorized access to systems</li>
              <li>Scrape or harvest data without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Payment and Billing</h2>
            <p className="text-muted-foreground">
              Paid subscriptions are billed in advance on a monthly or yearly basis.
              All payments are processed through LemonSqueezy. Refunds are handled on a
              case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              MiniEmployee shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users
              of any material changes via email or through the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us at legal@miniemployee.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
