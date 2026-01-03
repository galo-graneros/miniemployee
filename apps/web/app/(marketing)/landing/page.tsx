'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  Bot, 
  Zap, 
  Shield, 
  Clock, 
  Globe, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  Menu,
  X,
  Star,
  Play,
  ChevronDown,
  Sparkles,
  Code,
  Database,
  Mail,
  CreditCard,
  Repeat
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AutoAgent</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-zinc-400 hover:text-white transition-colors">FAQ</a>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">Sign In</Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900 border-t border-zinc-800">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-zinc-400 hover:text-white">Features</a>
              <a href="#pricing" className="block text-zinc-400 hover:text-white">Pricing</a>
              <a href="#faq" className="block text-zinc-400 hover:text-white">FAQ</a>
              <Link href="/login" className="block text-zinc-400 hover:text-white">Sign In</Link>
              <Link href="/signup" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-zinc-800/50 rounded-full px-4 py-2 mb-6 border border-zinc-700">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-zinc-300">AI-Powered Browser Automation</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Your AI Employee That
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Browses The Web </span>
              For You
            </h1>
            
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              AutoAgent is your personal AI assistant that can navigate websites, fill forms, 
              scrape data, and complete complex browser tasks — all while you focus on what matters.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-lg px-8 py-6">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>5 free tasks/month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none"></div>
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="bg-zinc-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center text-sm text-zinc-400">AutoAgent Dashboard</div>
              </div>
              <div className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-950 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-zinc-400 text-lg">Interactive demo coming soon...</p>
                  <p className="text-zinc-500 text-sm mt-2">Sign up to be the first to try it!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-zinc-500 mb-8">Trusted by professionals and teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
            {['TechCorp', 'DataFlow', 'CloudSync', 'DevOps Inc', 'AILabs'].map((company) => (
              <div key={company} className="text-xl font-semibold text-zinc-400">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Automate</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              AutoAgent handles complex web tasks with human-like intelligence, 
              so you can focus on what you do best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="w-6 h-6" />}
              title="Browser Automation"
              description="Navigate any website, click buttons, fill forms, and interact with web pages just like a human would."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Lightning Fast"
              description="Complete tasks in seconds that would take humans minutes or hours. Work 24/7 without breaks."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="Secure & Private"
              description="Your credentials are encrypted and stored securely. We never share your data with third parties."
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6" />}
              title="Human-in-the-Loop"
              description="For sensitive actions like 2FA or logins, AutoAgent asks for your input before proceeding."
            />
            <FeatureCard 
              icon={<Clock className="w-6 h-6" />}
              title="Real-Time Progress"
              description="Watch your tasks execute in real-time with detailed logs and status updates."
            />
            <FeatureCard 
              icon={<Database className="w-6 h-6" />}
              title="Secrets Vault"
              description="Store your credentials securely and let AutoAgent use them when needed for your tasks."
            />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Can AutoAgent Do?</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              From simple tasks to complex workflows, AutoAgent handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <UseCaseCard 
              icon={<Mail className="w-8 h-8" />}
              title="Email & Communication"
              examples={[
                "Check and organize emails",
                "Send scheduled messages",
                "Update social media profiles",
                "Respond to inquiries"
              ]}
            />
            <UseCaseCard 
              icon={<Code className="w-8 h-8" />}
              title="Data & Research"
              examples={[
                "Scrape product prices",
                "Monitor competitor websites",
                "Gather market research",
                "Extract contact information"
              ]}
            />
            <UseCaseCard 
              icon={<CreditCard className="w-8 h-8" />}
              title="E-commerce & Finance"
              examples={[
                "Track order statuses",
                "Download invoices",
                "Update product listings",
                "Check account balances"
              ]}
            />
            <UseCaseCard 
              icon={<Repeat className="w-8 h-8" />}
              title="Repetitive Tasks"
              examples={[
                "Fill out forms automatically",
                "Update spreadsheets",
                "Backup important data",
                "Generate reports"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
              <h3 className="text-xl font-semibold mb-2">Free Trial</h3>
              <p className="text-zinc-400 mb-6">Perfect for trying out AutoAgent</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-zinc-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="5 AI tasks per month" />
                <PricingFeature text="Basic browser automation" />
                <PricingFeature text="Email support" />
                <PricingFeature text="1 concurrent task" />
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </div>

            {/* Monthly Plan */}
            <div className="bg-gradient-to-b from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/30 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro Monthly</h3>
              <p className="text-zinc-400 mb-6">For individuals and small teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-zinc-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="Unlimited AI tasks" highlight />
                <PricingFeature text="Advanced browser automation" />
                <PricingFeature text="Priority support" />
                <PricingFeature text="Secrets vault" />
                <PricingFeature text="Task history & analytics" />
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Start Pro Trial
                </Button>
              </Link>
            </div>

            {/* Yearly Plan */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
              <h3 className="text-xl font-semibold mb-2">Pro Yearly</h3>
              <p className="text-zinc-400 mb-6">Best value — save 2 months</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$490</span>
                <span className="text-zinc-400">/year</span>
                <div className="text-green-400 text-sm mt-1">Save $98/year</div>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature text="Everything in Pro Monthly" />
                <PricingFeature text="2 months free" highlight />
                <PricingFeature text="Priority onboarding" />
                <PricingFeature text="Annual billing" />
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant="outline">Get Yearly Plan</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Users</h2>
            <p className="text-xl text-zinc-400">See what our customers have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="AutoAgent saved me hours of repetitive work every week. It's like having a virtual assistant that never sleeps."
              author="Sarah J."
              role="Marketing Manager"
            />
            <TestimonialCard 
              quote="The human-in-the-loop feature gives me confidence that my sensitive data is handled securely. Brilliant implementation."
              author="Michael T."
              role="Software Engineer"
            />
            <TestimonialCard 
              quote="I use AutoAgent for data scraping and it's incredibly reliable. The real-time progress updates are a game changer."
              author="Emily R."
              role="Data Analyst"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-zinc-400">Everything you need to know about AutoAgent</p>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="What is AutoAgent?"
              answer="AutoAgent is an AI-powered browser automation tool that can navigate websites, fill forms, and complete complex web tasks on your behalf. It uses advanced AI to understand and execute your instructions."
              isOpen={openFaq === 0}
              onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
            />
            <FAQItem 
              question="Is my data secure?"
              answer="Absolutely. We use bank-level encryption for all stored credentials. Your data is never shared with third parties, and our human-in-the-loop system ensures you maintain control over sensitive actions."
              isOpen={openFaq === 1}
              onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
            />
            <FAQItem 
              question="What websites can AutoAgent work with?"
              answer="AutoAgent can work with virtually any website. It uses a real browser to navigate sites, so it handles JavaScript, dynamic content, and even sites that require login. For login-protected sites, you'll be asked to provide credentials securely."
              isOpen={openFaq === 2}
              onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
            />
            <FAQItem 
              question="How does the free trial work?"
              answer="The free trial gives you 5 AI tasks per month at no cost. No credit card required. When you're ready for unlimited tasks, you can upgrade to Pro for $49/month or $490/year."
              isOpen={openFaq === 3}
              onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
            />
            <FAQItem 
              question="Can I cancel my subscription anytime?"
              answer="Yes! You can cancel your subscription at any time from your settings page. Your access will continue until the end of your billing period. No questions asked, no cancellation fees."
              isOpen={openFaq === 4}
              onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
            />
            <FAQItem 
              question="What happens if a task fails?"
              answer="If a task fails, you'll see detailed error logs explaining what went wrong. The task won't count against your monthly limit if it fails due to a system error. You can retry the task with adjusted instructions."
              isOpen={openFaq === 5}
              onClick={() => setOpenFaq(openFaq === 5 ? null : 5)}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl border border-blue-500/30 p-12">
            <h2 className="text-4xl font-bold mb-4">Ready to Automate Your Work?</h2>
            <p className="text-xl text-zinc-400 mb-8">
              Join thousands of professionals who save hours every week with AutoAgent.
              Start your free trial today.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">AutoAgent</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Your AI employee that browses the web for you.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
            © {new Date().getFullYear()} AutoAgent. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}

function UseCaseCard({ icon, title, examples }: { icon: React.ReactNode; title: string; examples: string[] }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-blue-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {examples.map((example, i) => (
          <li key={i} className="flex items-center gap-2 text-zinc-400">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span>{example}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PricingFeature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle className={`w-5 h-5 ${highlight ? 'text-green-400' : 'text-zinc-500'}`} />
      <span className={highlight ? 'text-white font-medium' : 'text-zinc-400'}>{text}</span>
    </li>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-zinc-300 mb-4">&quot;{quote}&quot;</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-zinc-500 text-sm">{role}</p>
      </div>
    </div>
  )
}

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <button 
        className="w-full px-6 py-4 flex items-center justify-between text-left"
        onClick={onClick}
      >
        <span className="font-medium">{question}</span>
        <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-zinc-400">
          {answer}
        </div>
      )}
    </div>
  )
}
