# MiniEmployee - AI Browser Agent SaaS

A full-featured SaaS platform where AI "mini-employees" execute browser-based tasks with secure credential handling.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              ARCHITECTURE                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │   FRONTEND      │  Next.js 15 + React 19                                  │
│  │   (Vercel)      │  Tailwind CSS + shadcn/ui                               │
│  │                 │  Static pages + Client components                       │
│  └────────┬────────┘                                                         │
│           │                                                                  │
│           │ HTTPS (Supabase JS Client)                                       │
│           ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         SUPABASE (Backend)                               │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐│ │
│  │  │   Auth        │  │  PostgreSQL   │  │     Edge Functions            ││ │
│  │  │  - Email/Pass │  │  - profiles   │  │  - setup-2fa                  ││ │
│  │  │  - Google     │  │  - chats      │  │  - verify-2fa                 ││ │
│  │  │  - OAuth      │  │  - messages   │  │  - disable-2fa                ││ │
│  │  └───────────────┘  │  - tasks      │  │  - create-checkout            ││ │
│  │                     │  - subs...    │  │  - manage-subscription        ││ │
│  │  ┌───────────────┐  │  - billing    │  │  - lemonsqueezy-webhook       ││ │
│  │  │  Realtime     │  │  - vault      │  │  - delete-account             ││ │
│  │  │  (WebSocket)  │  │  - usage      │  └───────────────────────────────┘│ │
│  │  └───────────────┘  └───────────────┘                                    │ │
│  │                     ┌───────────────────────────────────────────────────┐│ │
│  │                     │            SQL RPC Functions                      ││ │
│  │                     │  - increment_usage      - setup_2fa               ││ │
│  │                     │  - can_create_task      - disable_2fa             ││ │
│  │                     │  - upsert_subscription  - get_subscription_status ││ │
│  │                     │  - record_billing_event - expire_subscription     ││ │
│  │                     └───────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│           ▲                                                                  │
│           │ Polling (Service Role Key)                                       │
│           │                                                                  │
│  ┌────────┴────────┐                                                         │
│  │   WORKER        │  Python + browser-use + Playwright                      │
│  │ (DigitalOcean)  │  Claude AI (Anthropic) for automation                   │
│  │                 │  Polls tasks, executes browser actions                  │
│  └─────────────────┘                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Authentication & Security
- 🔐 Email/password authentication via Supabase Auth
- 🔑 Google OAuth sign-in
- 🔐 Two-Factor Authentication (TOTP) with backup codes
- 🔒 Strong password requirements (12+ chars, mixed case, numbers, symbols)
- 🛡️ Row Level Security on all database tables

### Billing & Subscriptions (LemonSqueezy)
- 💳 Secure payment processing
- 📊 Free tier: 5 credits/month
- 💎 Pro tier: $49/month or $490/year (unlimited)
- 🔄 Subscription management (upgrade, cancel, resume)

### AI Agent
- 🤖 Browser automation with browser-use
- 🧠 Powered by Claude AI (Anthropic)
- 📝 Real-time task logging
- 🔐 Secure secrets vault for credentials
- 🔄 Human-in-the-loop for login/2FA prompts

## 📁 Project Structure

```
/
├── apps/
│   ├── web/                     # Next.js 15 frontend (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, signup, password reset
│   │   │   ├── (marketing)/     # Landing, terms, privacy
│   │   │   ├── auth/callback/   # OAuth callback handler
│   │   │   ├── settings/        # User settings
│   │   │   ├── vault/           # Secrets vault
│   │   │   └── history/         # Task history
│   │   ├── components/
│   │   │   ├── auth/            # Auth provider
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── chat.tsx         # Main chat interface
│   │   │   └── sidebar.tsx      # Navigation
│   │   └── lib/
│   │       ├── supabase.ts          # Browser Supabase client
│   │       ├── supabase-server.ts   # Server Supabase client
│   │       ├── supabase-functions.ts # Edge function helpers
│   │       └── auth.ts              # Auth utilities
│   │
│   └── worker/                  # Python worker (DigitalOcean)
│       ├── main.py              # Worker entry point
│       ├── agent.py             # Browser automation with Claude
│       ├── human_loop.py        # Login/2FA detection
│       ├── requirements.txt
│       ├── Dockerfile
│       └── do-app-spec.yaml     # DigitalOcean App Platform config
│
├── supabase/                    # Supabase CLI configuration
│   └── migrations/              # Database migrations
│
├── supabase_schema.sql          # Complete database schema
├── vercel.json                  # Vercel deployment config
└── README.md
```

## 🔌 Supabase Edge Functions

All backend logic runs on Supabase Edge Functions:

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `setup-2fa` | Generate TOTP secret and backup codes | ✅ |
| `verify-2fa` | Verify TOTP code and enable 2FA | ✅ |
| `disable-2fa` | Verify code and disable 2FA | ✅ |
| `create-checkout` | Create LemonSqueezy checkout session | ✅ |
| `manage-subscription` | Get/cancel/resume subscription | ✅ |
| `lemonsqueezy-webhook` | Handle LemonSqueezy payment events | ❌ |
| `delete-account` | Soft delete account (30 day grace) | ✅ |

## 🔧 SQL RPC Functions

Direct database operations via Supabase RPC:

| Function | Purpose |
|----------|---------|
| `increment_usage(user_id)` | Deduct credit for free users |
| `can_create_task(user_id)` | Check if user can create task |
| `setup_2fa(user_id, secret, codes)` | Store 2FA credentials |
| `verify_and_enable_2fa(user_id)` | Enable 2FA after verification |
| `disable_2fa(user_id)` | Clear 2FA data |
| `upsert_subscription(...)` | Create/update subscription |
| `get_subscription_status(user_id)` | Get subscription details |
| `cancel_subscription(user_id)` | Mark for cancellation |
| `resume_subscription(user_id)` | Resume cancelled subscription |
| `expire_subscription(ls_id)` | Downgrade to free tier |

---

## 🚀 Deployment Guide

### Prerequisites
- [Supabase](https://supabase.com) account
- [Vercel](https://vercel.com) account
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

3. **Configure Authentication**:
   - Go to Authentication > Providers
   - Enable Email
   - Enable Google (add OAuth credentials)
   - Add redirect URLs:
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`

4. **Get your API keys**:
   - Go to Settings > API
   - Copy: `Project URL`, `anon public key`, `service_role key`

5. **Set Edge Function secrets**:
   - Go to Settings > Edge Functions
   - Add secrets:
     ```
     LEMONSQUEEZY_API_KEY=your_key
     LEMONSQUEEZY_STORE_ID=your_store_id
     LEMONSQUEEZY_MONTHLY_VARIANT_ID=your_variant
     LEMONSQUEEZY_YEARLY_VARIANT_ID=your_variant
     LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
     APP_URL=https://your-app.vercel.app
     ```

6. **Configure LemonSqueezy webhook**:
   - In LemonSqueezy dashboard, add webhook URL:
     `https://YOUR_PROJECT_REF.supabase.co/functions/v1/lemonsqueezy-webhook`

---

### Step 2: Vercel Deployment

1. **Connect your repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Set root directory to `apps/web`

2. **Add environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **Deploy**:
   - Click Deploy
   - Vercel will build and deploy automatically

---

### Step 3: DigitalOcean Worker

#### Option A: App Platform (Recommended)

1. Go to DigitalOcean > Apps > Create App
2. Connect your GitHub repository
3. Set source directory: `apps/worker`
4. Add environment variables:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ANTHROPIC_API_KEY=sk-ant-...
   WORKER_ID=worker-do-1
   ```
5. Deploy

#### Option B: Droplet

1. Create Ubuntu 22.04 Droplet (4GB+ RAM)
2. SSH into droplet
3. Clone repo and run setup:
   ```bash
   git clone https://github.com/your-user/miniemployee.git
   cd miniemployee/apps/worker
   chmod +x setup-droplet.sh
   ./setup-droplet.sh
   ```
4. Create `.env` file with credentials
5. Start worker:
   ```bash
   docker build -t worker .
   docker run -d --name worker --env-file .env worker
   ```

---

## 🔐 Environment Variables

### Frontend (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Worker (DigitalOcean)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc... (service_role key)
ANTHROPIC_API_KEY=sk-ant-api03-...
WORKER_ID=worker-do-1
LOG_LEVEL=INFO
POLL_INTERVAL=2
```

### Supabase Edge Functions
Set in Supabase Dashboard > Settings > Edge Functions > Secrets:
```
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_MONTHLY_VARIANT_ID=...
LEMONSQUEEZY_YEARLY_VARIANT_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
APP_URL=https://your-app.vercel.app
```

---

## 🧪 Local Development

### Frontend
```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm install
npm run dev
```

### Worker
```bash
cd apps/worker
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python main.py
```

---

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles, linked to auth.users |
| `chats` | Conversation sessions |
| `messages` | Chat messages (user, assistant, system, agent_log) |
| `tasks` | Browser automation tasks |
| `subscriptions` | LemonSqueezy subscription records |
| `billing_history` | Payment history |
| `secrets_vault` | Encrypted user credentials |
| `usage_tracking` | Monthly credit tracking |

All tables have Row Level Security (RLS) enabled.

---

## 📄 License

MIT License - see LICENSE file for details.
