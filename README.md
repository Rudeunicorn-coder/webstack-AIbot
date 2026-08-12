# WebStackPro

**WebStackPro — Automate. Convert. Grow.**
A 24/7 AI Agent + Unified Inbox for Nigerian businesses. It connects WhatsApp, Instagram DM, Facebook Messenger and Website Chat into one WebStackPro dashboard. The AI answers first; when it can't, it hands off to a human agent.

> © 2026 WebStackPro · Owerri, Nigeria · A WebStackPro Product

---

## What WebStackPro Does

- **WebStackPro AI Agent** — GPT-4o-mini with Retrieval-Augmented Generation (RAG) over your Knowledge Base. Answers fast in a friendly Nigerian tone.
- **Unified Inbox** — every message from WhatsApp, Instagram, Messenger and your website lands in one `WebStackPro Dashboard`.
- **Human Hand-off** — when AI confidence drops below 0.8 the conversation flips to `status = "human"` and your team is notified (`WebStackPro needs human help`).
- **Real-time** — Socket.io pushes `New message on WebStackPro` toasts live.
- **Paystack Billing** — Free 14-day trial, Starter ₦50,000/mo, Pro ₦120,000/mo. Webhook activates/deactivates accounts.
- **Trainable** — upload `.txt`/`.pdf` knowledge. Embeddings stored with pgvector on Supabase.

## Tech Stack

| Layer      | Technology                                                      |
| ---------- | --------------------------------------------------------------- |
| Frontend   | Next.js 14 App Router · TailwindCSS · shadcn/ui · Zustand        |
| Backend    | Node.js + Express + Prisma                                      |
| Database   | Supabase Postgres · Supabase Auth · pgvector                    |
| AI         | OpenAI GPT-4o-mini + RAG for WebStackPro                        |
| Queue      | BullMQ + Redis                                                  |
| Realtime   | Socket.io                                                       |
| Payments   | Paystack Subscriptions                                          |
| Storage    | Supabase Storage                                                |
| Deploy     | Frontend → Vercel · Backend & worker → Railway                  |

## Repository Layout

```
webstackpro/
├── frontend/                 Next.js 14 App
│   ├── app/
│   │   ├── page.tsx          WebStackPro landing page
│   │   ├── login/page.tsx    Login to WebStackPro (Supabase Auth)
│   │   └── dashboard/        Unified Inbox / Knowledge / Settings
│   ├── components/           WebStackPro UI + inbox components
│   ├── lib/                  api client, store, types, utils, supabase
│   └── public/webstackpro-widget.js   Website chat widget
├── backend/
│   ├── prisma/schema.prisma  WebStackPro data model
│   ├── prisma/seed.js        "Demo WebStackPro Business" seed
│   └── src/
│       ├── index.js          Express + Socket.io server
│       ├── lib/ai.js         WebStackPro AI Agent engine
│       ├── lib/pgvector.js   RAG search (vector + keyword fallback)
│       ├── lib/inbox.js      Unified inbox pipeline
│       ├── adapters/         WhatsApp / Instagram / Messenger
│       ├── routes/           webhooks, inbox, knowledge, billing, settings
│       └── jobs/             BullMQ queue + AI worker
└── package.json              npm workspace scripts
```

## Prerequisites

- Node.js 18+
- npm
- Supabase project (Postgres + Auth). Enable pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
- OpenAI API key
- Redis (for BullMQ jobs) — e.g. Upstash or Railway Redis
- Paystack test keys
- (Optional) Meta developer app for WhatsApp/Instagram/Messenger

## How To Setup WebStackPro

### 1. Configure both environments

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in `backend/.env`:
- `DATABASE_URL` — Supabase Postgres connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `REDIS_URL`
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `WEBHOOK_SECRET`

### 2. Install, migrate, seed

```bash
npm install
npm run db:push          # prisma db push (creates tables)
npm run seed             # seeds "Demo WebStackPro Business"
```

The WebStackPro seeder creates a demo business with 4 connected channels, 5 conversations, agents, tags and a 5-entry knowledge base.

### 3. Start Redis (for the WebStackPro AI worker)

```bash
# Redis must be reachable at REDIS_URL.
# Windows/Linux/macOS options: docker run -p 6379:6379 redis
```

### 4. Run the stack

```bash
npm run dev              # Express API (:4000) + Next.js (:3000) together
npm run worker           # separate terminal — processes WebStackPro AI jobs
```

Open **http://localhost:3000** — land on WebStackPro, sign in (Supabase Auth), then `/dashboard`.

> **Demo shortcut:** if you don't have Supabase configured yet, drop a fake token in `localStorage`:
> `localStorage.setItem("webstackpro_token","demo")` then visit `/dashboard` — the UI renders, and the demo API data appears once the backend + database are wired.

### 5. Connect your channels (WebStackPro dashboard → Settings)

- **WhatsApp**: Meta Cloud API webhook URL `https://YOUR-API/api/webhooks/whatsapp` + token
- **Instagram**: `https://YOUR-API/api/webhooks/instagram`
- **Messenger**: `https://YOUR-API/api/webhooks/messenger`
- **Website Chat**: embed the WebStackPro widget:

```html
<script src="https://YOUR-APP/webstackpro-widget.js" data-business="YOUR_BUSINESS_ID" async></script>
```

### 6. Billing with Paystack

- Install the Paystack webhook to `https://YOUR-API/api/billing/webhook` and set your `WEBHOOK_SECRET`.
- Send header `x-webstackpro-signature: HMAC-SHA256(secret, body)` on each event (a webhook proxy or verified-signed provider that signs requests works).
- `charge.success` / `subscription.create` activates the account; failed payments deactivate it.

## WebStackPro Data Model

```prisma
model WebStackProBusiness   { id, name, ownerId, plan }
model WebStackProConversation { id, businessId, channel, status }
model WebStackProMessage    { id, conversationId, text, channel }
model WebStackProKnowledge  { id, businessId, content, embedding(vector) }
model WebStackProAgent      { id, businessId, email }
```

Plus `Contact`, `Channel`, `Subscription`, `Note`, `Tag` for the full product.

## WebStackPro AI Agent Flow

On a new inbound message the worker:

1. Checks `conversation.status === "human"` → skips AI if a human is handling it.
2. Retrieves the business knowledge base via pgvector RAG.
3. Calls GPT-4o-mini with the WebStackPro system prompt:

```
You are WebStackPro AI Assistant for {business_name}. You work for WebStackPro.
Answer fast, friendly, Nigerian tone. Use only Knowledge Base.
If unsure: "No wahala, let me get my WebStackPro manager for you"
```

4. Confidence ≥ 0.8 → sends the reply back over the customer's channel.
5. Confidence < 0.8 → sets `status = "human"` and notifies `WebStackPro needs human help`.

## Sample WebStackPro Knowledge Base

```
Q: What is WebStackPro delivery time in Owerri?
A: WebStackPro customers get 24-48 hours delivery within Owerri.

Q: How does WebStackPro billing work?
A: WebStackPro Starter is ₦50,000/mo. Billed via Paystack.
```

## Deployment

- **Frontend** → Vercel: import the `frontend/` directory, set the `NEXT_PUBLIC_*` env vars.
- **Backend + worker** → Railway: two services from `backend/` (`npm start` and `npm run worker`), set the `backend/.env` vars.
- **Auth** → Supabase: add a Google OAuth provider and your Redirect URL in Supabase Auth settings.

## Brand

- Company: **WebStackPro**
- Tagline: **WebStackPro - Automate. Convert. Grow.**
- Location: **Owerri, Nigeria**
- Colors: `#0A1F44` Navy · `#00D4FF` Cyan · `#FFFFFF` White
- Logo: stack of 3 layers forming a "W" with a chat bubble + AI circuit