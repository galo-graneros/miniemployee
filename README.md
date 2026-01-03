# AutoAgent SaaS MVP

A SaaS platform for AI "mini-employees" that execute browser-based tasks with Human-in-the-loop credential handling.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│    Supabase     │◀────│  Python Worker  │
│    (Vercel)     │     │   (Realtime)    │     │ (DigitalOcean)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Project Structure

```
/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── worker/       # Python browser-use agent
├── supabase_schema.sql
└── README.md
```

## Setup

### 1. Database Setup
Apply the schema to your Supabase project:
```bash
# Via Supabase Dashboard SQL Editor, run supabase_schema.sql
```

### 2. Frontend Setup
```bash
cd apps/web
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

### 3. Worker Setup
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

## Environment Variables

### Frontend (`apps/web/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Worker (`apps/worker/.env`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`

## License

MIT
