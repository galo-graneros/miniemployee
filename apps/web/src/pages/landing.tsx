import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { Bot, Zap, Shield, CreditCard } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>MiniEmployee - AI Browser Agent</title>
        <meta name="description" content="AI-powered browser automation that executes tasks for you" />
      </Helmet>

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">MiniEmployee</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Your AI Browser Assistant
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          MiniEmployee executes browser-based tasks for you using AI.
          From filling forms to extracting data, let AI handle the tedious work.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/signup">
            <Button size="lg">Start Free - 5 Credits</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">Login</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browser Automation</h3>
              <p className="text-muted-foreground">
                AI-powered browser agent that can navigate websites, fill forms, and extract data.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Vault</h3>
              <p className="text-muted-foreground">
                Store credentials securely. The agent uses them only when needed for your tasks.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border">
              <CreditCard className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Simple Pricing</h3>
              <p className="text-muted-foreground">
                Start free with 5 credits. Go Pro for unlimited tasks at $49/month or $490/year.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-4xl font-bold mb-4">$0</p>
              <ul className="space-y-2 mb-6 text-muted-foreground">
                <li>✓ 5 credits per month</li>
                <li>✓ Basic browser automation</li>
                <li>✓ Secure vault</li>
              </ul>
              <Link to="/signup">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            <div className="border-2 border-primary rounded-lg p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-4">
                $49<span className="text-lg font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">or $490/year (save $98)</p>
              <ul className="space-y-2 mb-6 text-muted-foreground">
                <li>✓ Unlimited tasks</li>
                <li>✓ Priority execution</li>
                <li>✓ Secure vault</li>
                <li>✓ Email support</li>
              </ul>
              <Link to="/signup">
                <Button className="w-full">Upgrade to Pro</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-semibold">MiniEmployee</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MiniEmployee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
