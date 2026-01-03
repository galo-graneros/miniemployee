import Link from 'next/link'
import { Bot, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
              <p className="text-zinc-400 text-sm">Last updated: January 2, 2026</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-zinc-400 leading-relaxed">
              AutoAgent (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our AI-powered browser automation service.
            </p>
            <p className="text-zinc-400 leading-relaxed mt-4">
              Please read this policy carefully. By using AutoAgent, you consent to the data practices 
              described in this policy. If you do not agree with the terms of this policy, please do 
              not use our Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-white mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password when you register</li>
              <li><strong>Profile Information:</strong> Avatar, display name, preferences</li>
              <li><strong>Payment Information:</strong> Billing details processed by our payment provider (LemonSqueezy)</li>
              <li><strong>Secrets Vault:</strong> Credentials you choose to store for automation tasks (encrypted)</li>
              <li><strong>Task Instructions:</strong> The prompts and instructions you provide for automation</li>
              <li><strong>Support Communications:</strong> Messages you send to our support team</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-2 mt-6">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li><strong>Usage Data:</strong> Task history, feature usage, interactions with the Service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, pages viewed, errors encountered</li>
              <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-2 mt-6">2.3 Information from Third Parties</h3>
            <p className="text-zinc-400 leading-relaxed">
              When AutoAgent performs tasks on your behalf, it may access information from third-party 
              websites. This information is processed solely to execute your requested tasks and is 
              not retained beyond the task duration unless you specifically save it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-zinc-400 leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your transactions and manage your subscription</li>
              <li>Execute automation tasks as instructed by you</li>
              <li>Send you service-related notifications and updates</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
            <p className="text-zinc-400 leading-relaxed">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li><strong>Encryption at Rest:</strong> All sensitive data, including credentials in the Secrets Vault, is encrypted using AES-256 encryption</li>
              <li><strong>Encryption in Transit:</strong> All data transmission uses TLS 1.3</li>
              <li><strong>Access Controls:</strong> Strict role-based access controls for our team</li>
              <li><strong>Two-Factor Authentication:</strong> Available for all accounts</li>
              <li><strong>Regular Audits:</strong> We conduct regular security assessments</li>
              <li><strong>Secure Infrastructure:</strong> Hosted on enterprise-grade cloud infrastructure</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed mt-4">
              While we strive to protect your data, no method of transmission or storage is 100% secure. 
              We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-zinc-400 leading-relaxed">
              We do not sell your personal information. We may share your information in the following situations:
            </p>
            
            <h3 className="text-lg font-medium text-white mb-2 mt-6">5.1 Service Providers</h3>
            <p className="text-zinc-400 leading-relaxed">
              We share data with trusted third-party service providers who assist us in operating the Service:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Payment processing (LemonSqueezy)</li>
              <li>Cloud hosting and infrastructure (Supabase, Vercel)</li>
              <li>AI services (Anthropic - Claude)</li>
              <li>Analytics and monitoring</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-2 mt-6">5.2 Legal Requirements</h3>
            <p className="text-zinc-400 leading-relaxed">
              We may disclose your information if required by law, court order, or government request, 
              or if we believe disclosure is necessary to protect our rights, your safety, or the 
              safety of others.
            </p>

            <h3 className="text-lg font-medium text-white mb-2 mt-6">5.3 Business Transfers</h3>
            <p className="text-zinc-400 leading-relaxed">
              In the event of a merger, acquisition, or sale of assets, your information may be 
              transferred. We will notify you of any such change.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">6. Data Retention</h2>
            <p className="text-zinc-400 leading-relaxed">
              We retain your data for as long as necessary to provide the Service and fulfill the 
              purposes described in this policy:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li><strong>Account Data:</strong> Retained until you delete your account</li>
              <li><strong>Task History:</strong> Retained for 90 days, then automatically deleted</li>
              <li><strong>Secrets Vault:</strong> Retained until you delete individual secrets or your account</li>
              <li><strong>Billing Records:</strong> Retained for 7 years for legal/tax compliance</li>
              <li><strong>Log Data:</strong> Retained for 30 days</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed mt-4">
              When you delete your account, we initiate a 30-day deletion process. After this period, 
              your data is permanently removed from our systems, except for data we&apos;re legally required 
              to retain.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights and Choices</h2>
            <p className="text-zinc-400 leading-relaxed">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Export:</strong> Request a portable copy of your data</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
              <li><strong>Restriction:</strong> Request restriction of data processing</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed mt-4">
              To exercise these rights, please contact us at privacy@autoagent.ai or use the settings 
              in your account dashboard.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
            <p className="text-zinc-400 leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our Service</li>
              <li>Improve and optimize the Service</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed mt-4">
              You can control cookies through your browser settings. Note that disabling cookies may 
              affect Service functionality.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">9. International Data Transfers</h2>
            <p className="text-zinc-400 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. 
              These countries may have different data protection laws. We ensure appropriate safeguards 
              are in place for such transfers, including standard contractual clauses approved by 
              relevant authorities.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-zinc-400 leading-relaxed">
              The Service is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a 
              child, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">11. California Privacy Rights (CCPA)</h2>
            <p className="text-zinc-400 leading-relaxed">
              If you are a California resident, you have additional rights under the California Consumer 
              Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know whether your data is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">12. European Privacy Rights (GDPR)</h2>
            <p className="text-zinc-400 leading-relaxed">
              If you are in the European Economic Area (EEA), you have rights under the General Data 
              Protection Regulation (GDPR). Our legal basis for processing includes:
            </p>
            <ul className="list-disc list-inside text-zinc-400 mt-4 space-y-2">
              <li>Contract performance (providing the Service)</li>
              <li>Legitimate interests (improving and securing the Service)</li>
              <li>Consent (where explicitly provided)</li>
              <li>Legal obligations</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed mt-4">
              You may lodge a complaint with your local data protection authority if you believe your 
              rights have been violated.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">13. Changes to This Policy</h2>
            <p className="text-zinc-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new policy on this page and updating the &quot;Last updated&quot; date. For 
              significant changes, we will provide additional notice via email.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">14. Contact Us</h2>
            <p className="text-zinc-400 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="text-zinc-400 mt-4">
              Email: privacy@autoagent.ai<br />
              Data Protection Officer: dpo@autoagent.ai<br />
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
