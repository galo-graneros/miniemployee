import Link from 'next/link'
import { Bot, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Terms of Service</h1>
              <p className="text-zinc-400 text-sm">Last updated: January 2, 2026</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-zinc-400 leading-relaxed">
              By accessing or using AutoAgent (&quot;the Service&quot;), you agree to be bound by these Terms of Service 
              (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Service.
            </p>
            <p className="text-zinc-400 leading-relaxed mt-4">
              These Terms apply to all visitors, users, and others who access or use the Service. 
              By using the Service, you represent that you are at least 18 years of age and have the 
              legal capacity to enter into these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-zinc-400 leading-relaxed">
              AutoAgent is an AI-powered browser automation platform that allows users to automate 
              web-based tasks. The Service includes:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>AI-driven browser automation capabilities</li>
              <li>Secure credential storage (Secrets Vault)</li>
              <li>Task history and analytics</li>
              <li>Human-in-the-loop verification for sensitive actions</li>
              <li>Real-time task monitoring and logging</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
            <h3 className="text-lg font-medium text-white mb-2">3.1 Account Creation</h3>
            <p className="text-zinc-400 leading-relaxed">
              To use certain features of the Service, you must create an account. You agree to provide 
              accurate, current, and complete information during registration and to update such 
              information to keep it accurate, current, and complete.
            </p>
            
            <h3 className="text-lg font-medium text-white mb-2 mt-6">3.2 Account Security</h3>
            <p className="text-zinc-400 leading-relaxed">
              You are responsible for safeguarding your account credentials and for any activities or 
              actions under your account. We encourage you to use a strong password and enable 
              two-factor authentication (2FA) for additional security.
            </p>
            
            <h3 className="text-lg font-medium text-white mb-2 mt-6">3.3 Account Termination</h3>
            <p className="text-zinc-400 leading-relaxed">
              You may delete your account at any time through the settings page. Upon deletion, your 
              data will be scheduled for permanent removal within 30 days. We reserve the right to 
              suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-zinc-400 leading-relaxed">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Access websites or services without authorization</li>
              <li>Engage in scraping activities that violate target website terms of service</li>
              <li>Distribute malware, spam, or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Circumvent rate limits or usage restrictions</li>
              <li>Use the Service for any illegal or fraudulent purpose</li>
              <li>Automate actions that could harm third parties</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">5. Subscription and Billing</h2>
            <h3 className="text-lg font-medium text-white mb-2">5.1 Free Trial</h3>
            <p className="text-zinc-400 leading-relaxed">
              New users receive 5 free AI task credits per month. Free credits reset at the beginning 
              of each calendar month. Unused credits do not roll over.
            </p>
            
            <h3 className="text-lg font-medium text-white mb-2 mt-6">5.2 Paid Subscriptions</h3>
            <p className="text-zinc-400 leading-relaxed">
              Pro Monthly: $49/month for unlimited AI tasks<br />
              Pro Yearly: $490/year for unlimited AI tasks (2 months free)
            </p>
            <p className="text-zinc-400 leading-relaxed mt-4">
              Subscriptions are billed in advance on a monthly or annual basis. Payment is processed 
              through our payment provider, LemonSqueezy.
            </p>
            
            <h3 className="text-lg font-medium text-white mb-2 mt-6">5.3 Cancellation and Refunds</h3>
            <p className="text-zinc-400 leading-relaxed">
              You may cancel your subscription at any time. Upon cancellation, you will retain access 
              until the end of your current billing period. We do not provide refunds for partial 
              months or unused time, except as required by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Service and its original content, features, and functionality are owned by AutoAgent 
              and are protected by international copyright, trademark, patent, trade secret, and other 
              intellectual property laws.
            </p>
            <p className="text-zinc-400 leading-relaxed mt-4">
              You retain ownership of any content you create or upload through the Service. By using 
              the Service, you grant us a limited license to process your content solely for the 
              purpose of providing the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">7. Third-Party Services</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Service may interact with third-party websites and services on your behalf. You 
              acknowledge that:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>We are not responsible for third-party content or services</li>
              <li>Your use of third-party services is subject to their terms</li>
              <li>We do not endorse any third-party services accessed through AutoAgent</li>
              <li>You are responsible for ensuring your use complies with third-party terms</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-zinc-400 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUTOAGENT SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
              REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, 
              OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-zinc-400 leading-relaxed mt-4">
              Our total liability for any claims under these Terms shall not exceed the amount you 
              paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-zinc-400 leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
              WHETHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, 
              SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-zinc-400 leading-relaxed">
              You agree to indemnify and hold harmless AutoAgent and its officers, directors, employees, 
              and agents from any claims, damages, losses, liabilities, and expenses arising from your 
              use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">11. Changes to Terms</h2>
            <p className="text-zinc-400 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of any changes 
              by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued 
              use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p className="text-zinc-400 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United 
              States, without regard to its conflict of law provisions. Any disputes arising under 
              these Terms shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">13. Contact Us</h2>
            <p className="text-zinc-400 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-zinc-400 mt-4">
              Email: legal@autoagent.ai<br />
              Address: AutoAgent Inc., 123 Tech Street, San Francisco, CA 94105
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-zinc-500 text-sm">
          © {new Date().getFullYear()} AutoAgent. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
