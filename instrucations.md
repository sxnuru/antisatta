# MATCHMARKET

## Complete Technical Documentation

### Final Architecture: Next.js (Vercel) + NestJS (Render) + PostgreSQL (Render)

---

# PROJECT SUMMARY

MatchMarket is a Polymarket-inspired prediction platform focused on FIFA matches and community-created prediction markets.

Users receive virtual tokens and use them to predict outcomes.

The platform is:

* Competitive
* Skill-based
* Community-driven

The platform is NOT:

* Gambling
* Real-money betting
* Cryptocurrency trading

---

# CORE FEATURES

### Authentication

* Registration
* Login
* Email Verification
* Password Reset
* JWT Authentication

---

### Prediction Markets

* FIFA Markets
* Community Markets
* Live Probabilities
* Dynamic Payouts

---

### Virtual Economy

* 1000 Starting Tokens
* Daily Rewards
* Weekly Streak Rewards
* Referral Rewards
* Recovery Tokens

---

### Community

* Comments
* Replies
* Likes
* Following Markets

---

### Competitive

* Rankings
* Leaderboards
* Achievements
* ROI Tracking

---

# SYSTEM ARCHITECTURE

```text
┌─────────────────────────┐
│         VERCEL          │
│     Next.js Frontend    │
└────────────┬────────────┘
             │ HTTPS
             ▼
┌─────────────────────────┐
│         RENDER          │
│      NestJS Backend     │
└───────┬─────────┬───────┘
        │         │
        ▼         ▼
 ┌──────────┐ ┌──────────┐
 │PostgreSQL│ │ Upstash  │
 │ Render   │ │  Redis   │
 └──────────┘ └──────────┘
        │
        ▼
 ┌──────────────┐
 │ Cloudinary   │
 └──────────────┘
```

---

# DEPLOYMENT STRUCTURE

Frontend:

```text
matchmarket-web
```

Hosted on:

```text
Vercel
```

---

Backend:

```text
matchmarket-api
```

Hosted on:

```text
Render Web Service
```

---

Database:

```text
matchmarket-db
```

Hosted on:

```text
Render PostgreSQL
```

---

Cache:

```text
Upstash Redis
```

---

Media:

```text
Cloudinary
```

---

# FRONTEND STACK

Framework:

```text
Next.js 15
```

Language:

```text
TypeScript
```

Styling:

```text
TailwindCSS
```

UI:

```text
ShadCN UI
```

State Management:

```text
Zustand
```

Server State:

```text
TanStack Query
```

Charts:

```text
Recharts
```

Animations:

```text
Framer Motion
```

Forms:

```text
React Hook Form
```

Validation:

```text
Zod
```

---

# BACKEND STACK

Framework:

```text
NestJS
```

Language:

```text
TypeScript
```

ORM:

```text
Prisma
```

Database:

```text
PostgreSQL
```

Authentication:

```text
JWT
Passport
bcrypt
```

Documentation:

```text
Swagger
```

Realtime:

```text
Socket.IO
```

Validation:

```text
Class Validator
```

Scheduling:

```text
@nestjs/schedule
```

---

# BACKEND MODULES

```text
src
│
├── auth
├── users
├── markets
├── outcomes
├── predictions
├── rewards
├── referrals
├── comments
├── notifications
├── football
├── websocket
├── leaderboard
├── achievements
├── admin
├── analytics
├── common
├── prisma
│
├── app.module.ts
└── main.ts
```

---

# USER FLOW

## Registration

User enters:

```text
Username
Email
Password
```

---

System:

```text
Create User
Create Wallet
Balance = 1000
```

---

User redirected:

```text
Dashboard
```

---

# TOKEN ECONOMY

## Starting Tokens

```text
1000
```

---

## Daily Login

```text
+50
```

---

## Weekly Streak

```text
+250
```

---

## Referral Reward

```text
+100
```

---

## Market Creator Reward

```text
+25
```

---

## Achievement Rewards

```text
10 - 500 Tokens
```

---

# RECOVERY TOKEN SYSTEM

When:

```text
Balance = 0
```

User receives:

```text
10 Tokens
```

Requirements:

```text
No Active Predictions
```

Cooldown:

```text
24 Hours
```

---

# MARKET TYPES

## FIFA Match Market

Example:

```text
Argentina vs Brazil
```

Options:

```text
Argentina Win
Draw
Brazil Win
```

---

## Community Market

Example:

```text
Will Messi score?
```

Options:

```text
YES
NO
```

---

# PROBABILITY ENGINE

System:

```text
Parimutuel Pool
```

Formula:

```text
Probability =
Outcome Pool /
Total Pool
```

---

Example:

```text
Argentina = 5000

Draw = 2500

Brazil = 2500

Total = 10000
```

Probabilities:

```text
Argentina = 50%
Draw = 25%
Brazil = 25%
```

---

# PAYOUT SYSTEM

Formula:

```text
Reward =
(User Stake / Winning Pool)
× Total Pool
```

---

Example:

```text
Winning Pool = 5000

Total Pool = 10000

User Stake = 100
```

Reward:

```text
200 Tokens
```

---

# DATABASE DESIGN

## USERS

```sql
id UUID
username VARCHAR(50)
email VARCHAR(255)
password_hash TEXT
avatar TEXT

balance INTEGER DEFAULT 1000

wins INTEGER
losses INTEGER

roi NUMERIC

role VARCHAR

recovery_claims INTEGER

last_recovery_claim TIMESTAMP

created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## MARKETS

```sql
id UUID

title VARCHAR(255)

description TEXT

category VARCHAR(50)

market_type VARCHAR(50)

status VARCHAR(50)

creator_id UUID

resolution_source TEXT

banner_url TEXT

starts_at TIMESTAMP

ends_at TIMESTAMP

resolved_at TIMESTAMP

created_at TIMESTAMP
```

---

## OUTCOMES

```sql
id UUID

market_id UUID

name VARCHAR(255)

pool_tokens INTEGER

probability NUMERIC
```

---

## PREDICTIONS

```sql
id UUID

user_id UUID

market_id UUID

outcome_id UUID

stake INTEGER

reward INTEGER

status VARCHAR

created_at TIMESTAMP
```

---

## COMMENTS

```sql
id UUID

market_id UUID

user_id UUID

content TEXT

parent_id UUID

created_at TIMESTAMP
```

---

## NOTIFICATIONS

```sql
id UUID

user_id UUID

title TEXT

message TEXT

read BOOLEAN

created_at TIMESTAMP
```

---

## ACHIEVEMENTS

```sql
id UUID

name VARCHAR

description TEXT

reward INTEGER
```

---

## USER_ACHIEVEMENTS

```sql
user_id UUID

achievement_id UUID

earned_at TIMESTAMP
```

---

# API FOOTBALL INTEGRATION

Provider:

```text
API-Football
```

Fetch:

```text
Fixtures
Live Scores
Standings
Teams
Players
Statistics
```

Cron Jobs:

```text
Every 30 Seconds
Live Matches

Every 1 Hour
Upcoming Fixtures
```

---

# WEBSOCKET EVENTS

```text
market:update

probability:update

prediction:new

leaderboard:update

comment:new

notification:new

score:update
```

---

# AUTHENTICATION

System:

```text
JWT Access Token
JWT Refresh Token
```

Access:

```text
15 Minutes
```

Refresh:

```text
30 Days
```

Password:

```text
bcrypt
12 rounds
```

---

# RENDER DEPLOYMENT

## Create PostgreSQL

Render Dashboard

```text
New
↓
PostgreSQL
```

Name:

```text
matchmarket-db
```

---

## Create Backend

Render Dashboard

```text
New
↓
Web Service
```

Repository:

```text
matchmarket-backend
```

---

Runtime:

```text
Node
```

---

Build Command

```bash
npm install
npm run build
```

---

Start Command

```bash
npm run start:prod
```

---

# REQUIRED ENV VARIABLES

Backend:

```env
DATABASE_URL=

JWT_SECRET=

JWT_REFRESH_SECRET=

FRONTEND_URL=https://your-app.vercel.app

REDIS_URL=

API_FOOTBALL_KEY=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

NODE_ENV=production

PORT=10000
```

---

# NESTJS MAIN CONFIGURATION

Requirements:

```text
Helmet
Validation Pipe
CORS
Swagger
Compression
```

---

CORS:

```typescript
origin: process.env.FRONTEND_URL
credentials: true
```

---

# HEALTH CHECK

Endpoint:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

Render Health Check:

```text
/health
```

---

# VERCEL DEPLOYMENT

Environment Variable:

```env
NEXT_PUBLIC_API_URL=https://matchmarket-api.onrender.com

NEXT_PUBLIC_WS_URL=https://matchmarket-api.onrender.com
```

---

# SECURITY

Implement:

```text
Helmet
Rate Limiting
CSRF Protection
Input Validation
SQL Injection Protection
XSS Protection
Audit Logs
JWT Rotation
Refresh Token Revocation
```

---

# TESTING

Unit Tests:

```text
Jest
```

Integration Tests:

```text
Supertest
```

E2E Tests:

```text
Playwright
```

---

# DEVOPS

Generate:

```text
Dockerfile

docker-compose.yml

render.yaml

GitHub Actions

Prisma Migrations

Database Seeds

Swagger Documentation

Production Logging

Monitoring
```

---

# FINAL CLAUDE PROMPT

Build a production-ready application called MatchMarket using Next.js 15 (deployed on Vercel) and NestJS (deployed on Render). Use PostgreSQL on Render, Prisma ORM, Upstash Redis, Cloudinary, JWT Authentication, Socket.IO, Swagger, and API-Football integration. Implement FIFA prediction markets, community-created markets, virtual token economy with 1000 starting tokens, recovery token system (10 tokens when balance reaches zero), parimutuel probability engine, real-time updates, achievements, referrals, comments, notifications, leaderboards, admin dashboard, analytics dashboard, Docker support, CI/CD, unit tests, integration tests, E2E tests, and Render/Vercel deployment configuration. Generate the project in phases starting with architecture, Prisma schema, ERD, folder structure, and database design before writing implementation code.
