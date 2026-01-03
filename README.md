# MiniEmployee - AI Browser Agent SaaS

A full-featured SaaS platform where AI "mini-employees" execute browser-based tasks with secure credential handling.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│    Supabase     │◀────│  Python Worker  │
│    (Vercel)     │     │  (Auth + DB +   │     │ (DigitalOcean)  │
│                 │     │   Realtime)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
   React 19                PostgreSQL              browser-use
   Tailwind CSS            Row Level Security     Claude AI
   shadcn/ui               Realtime Subscriptions Playwright
```

## ✨ Features

### Authentication & Security
- 🔐 Email/password authentication via Supabase Auth
- 🔑 Two-Factor Authentication (TOTP) with backup codes
- 🔒 Strong password requirements (12+ chars, mixed case, numbers, symbols)
- 🛡️ Row Level Security on all database tables

### Billing & Subscriptions
- 💳 LemonSqueezy integration for payments
- 📊 Free tier: 5 credits/month
- 💎 Pro tier: $49/month or $490/year (unlimited)
- 🔄 Subscription management (upgrade, cancel, resume)

### AI Agent
- 🤖 Browser automation with browser-use
- 🧠 Powered by Claude AI (Anthropic)
- 📝 Real-time task logging
- 🔐 Secure secrets vault for credentials

## 📁 Project Structure

```
/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── (auth)/      # Login, signup, password reset
│   │   │   ├── (marketing)/ # Landing, terms, privacy
│   │   │   ├── api/         # API routes
│   │   │   ├── settings/    # User settings
│   │   │   ├── vault/       # Secrets vault
│   │   │   └── history/     # Task history
│   │   ├── components/
│   │   └── lib/
│   └── worker/              # Python browser-use agent
│       ├── main.py          # Worker entry point
│       ├── agent.py         # Browser automation
│       ├── Dockerfile
│       └── do-app-spec.yaml # DigitalOcean config
├── supabase_schema.sql      # Database schema
├── vercel.json              # Vercel deployment config
└── README.md
```

---

## 🚀 Deployment Guide

### Prerequisites
- [Supabase](https://supabase.com) account (free tier works)
- [Vercel](https://vercel.com) account (free tier works)
- [DigitalOcean](https://digitalocean.com) account
- [LemonSqueezy](https://lemonsqueezy.com) account
- [Anthropic](https://anthropic.com) API key

---

### Step 1: Supabase Setup

1. **Create a new project** at [supabase.com/dashboard](https://supabase.com/dashboard)

2. **Run the database schema**:
   - Go to SQL Editor
   - Paste contents of `supabase_schema.sql`
   - Click "Run"

3. **Enable Email Auth**:
   - Go to Authentication > Providers
   - Ensure Email is enabled
   - Configure email templates if desired

4. **Get your API keys**:
   - Go to Settings > API
   - Copy: `Project URL`, `anon public key`, `service_role key`

5. **Configure Auth redirects**:
   - Go to Authentication > URL Configuration
   - Add your Vercel domain to "Redirect URLs":
     - `https://your-app.vercel.app/**`
     - `http://localhost:3000/**` (for local dev)

---

### Step 2: LemonSqueezy Setup

1. **Create a store** at [app.lemonsqueezy.com](https://app.lemonsqueezy.com)

2. **Create subscription products**:
   - Monthly Plan: $49/month
   - Yearly Plan: $490/year
   - Note the Variant IDs for each

3. **Get API key**:
   - Go to Settings > API
   - Create new API key

4. **Create webhook**:
   - Go to Settings > Webhooks
   - URL: `https://your-app.vercel.app/api/webhooks/lemonsqueezy`
   - Events: Select all subscription events
   - Copy the signing secret

---

### Step 3: Deploy to Vercel (Frontend)

1. **Import project**:
   ```bash
   # Option A: Via Vercel CLI
   npm i -g vercel
   vercel
   
   # Option B: Via Dashboard
   # Go to vercel.com/new and import from GitHub
   ```

2. **Configure environment variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   LEMONSQUEEZY_API_KEY=your_key
   LEMONSQUEEZY_WEBHOOK_SECRET=your_secret
   LEMONSQUEEZY_STORE_ID=your_store_id
   LEMONSQUEEZY_MONTHLY_VARIANT_ID=variant_id
   LEMONSQUEEZY_YEARLY_VARIANT_ID=variant_id
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

---

### Step 4: Deploy Worker to DigitalOcean

#### Option A: App Platform (Recommended)

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)

2. Create App → Select GitHub → Select `galo-graneros/miniemployee`

3. Configure:
   - Source Directory: `apps/worker`
   - Type: **Worker** (not Web Service)
   - Dockerfile Path: `Dockerfile`

4. Add environment variables:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ANTHROPIC_API_KEY=sk-ant-...
   WORKER_ID=do-worker-1
   LOG_LEVEL=INFO
   ```

5. Deploy!

#### Option B: Droplet with Docker

1. **Create Droplet**:
   - Ubuntu 22.04
   - Minimum 2GB RAM (for browser automation)
   - Basic plan ~$12/month

2. **SSH and run setup script**:
   ```bash
   ssh root@your-droplet-ip
   
   # Download and run setup script
   wget -O setup.sh https://raw.githubusercontent.com/galo-graneros/miniemployee/main/apps/worker/setup-droplet.sh
   chmod +x setup.sh
   sudo ./setup.sh
   ```

3. **Configure environment**:
   ```bash
   nano /opt/miniemployee/apps/worker/.env
   # Fill in your values
   ```

4. **Start worker**:
   ```bash
   systemctl start miniemployee-worker
   systemctl enable miniemployee-worker
   
   # Check logs
   journalctl -u miniemployee-worker -f
   ```

---

## 🛠️ Local Development

### Frontend
```bash
cd apps/web
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

### Worker
```bash
cd apps/worker
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Edit .env with your credentials
python main.py
```

---

## 📋 Environment Variables

### Frontend (`apps/web/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy API key |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook signing secret |
| `LEMONSQUEEZY_STORE_ID` | Your store ID |
| `LEMONSQUEEZY_MONTHLY_VARIANT_ID` | Monthly plan variant ID |
| `LEMONSQUEEZY_YEARLY_VARIANT_ID` | Yearly plan variant ID |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL |

### Worker (`apps/worker/.env`)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `WORKER_ID` | Unique worker identifier |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, etc.) |

---

## 🔧 Troubleshooting

### Worker not picking up tasks
- Check worker logs: `journalctl -u miniemployee-worker -f`
- Verify Supabase credentials are correct
- Ensure `tasks` table exists with correct schema

### Payments not working
- Verify LemonSqueezy webhook URL is correct
- Check webhook signing secret matches
- Look at Vercel function logs for errors

### Auth issues
- Add your domain to Supabase redirect URLs
- Check browser console for errors
- Verify anon key is correct

---

## 📄 License

MIT

---

## 🤝 Support

For issues, open a GitHub issue or contact support.
