# ⚡ VOLTLOOP

> **"We don't build more chargers. We unlock the chargers that already exist."**
>
> *Community-powered EV charging marketplace turning underutilized home AC chargers into a distributed network.*

![Voltloop Platform Overview](/public/ev-charging-hero.jpg)

---

## 🌎 The Infrastructure Gap

Private EV chargers are heavily underutilized while EV travelers struggle to find reliable charging on highways and rural routes.

* **The Idle Asset**: Over 85% of EV owners install 3.3 kW, 7.2 kW, 11 kW, or 22 kW AC wallboxes at their residences. These chargers remain idle for 18–20 hours daily.
* **The Highway & Semi-Urban Void**: Fast-charging infrastructure is sparse outside tier-1 expressways. EV travelers heading toward tier-2/3 towns or rural corridors face severe range anxiety and broken public stations.

---

## 💡 The Solution

VoltLoop is a peer-to-peer marketplace that bridges the gap by turning private driveways into secure, bookable charging hubs.

1. **Hosts unlock idle driveway chargers**: Homeowners earn money during overnight hours with transparent reimbursement for electricity, host parking fees, and platform trust.
2. **Drivers reserve guaranteed overnight plug-ins**: EV drivers wake up with 80–90% battery without waiting in commercial DC fast-charger queues.
3. **Decentralized & capital-light**: Unlocks existing grid-connected hardware without spending millions on new civil works or grid transformers.

---

## 🤖 Smart Charging Intelligence (AI)

VoltLoop integrates natively with **Google Gemini** to power its intelligent mobility engine, running deterministic physics calculations *before* AI ranking.

* **AI Trip Planner (`/ai`)**:
  * Evaluates vehicle onboard AC charger limits, battery capacity, delta state-of-charge (SOC), and highway trajectory.
  * Deterministically computes required kWh, charging duration (at 90% onboard efficiency), and 3-part pricing.
  * Uses Gemini AI to rank candidates and provide human-friendly explanations with verified alternative options.
* **Smart Community Pricing Recommendation**:
  * Suggests competitive host fees based on neighborhood amenities and regional electricity tariffs.
* **AI-Assisted Charger Verification**:
  * Multi-point computer vision inspection analyzing host installation photos.
  * Verifies wallbox presence, tethered cable condition, Type 2 / 16A port, and earthing status.

---

## 🏗️ Architecture Stack

Built for scale, speed, and cross-platform compatibility.

* **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS
* **Backend:** Next.js API Routes (Serverless)
* **Database & Auth:** Supabase (PostgreSQL), Row Level Security (RLS)
* **AI Engine:** Google Gemini (gemini-flash-latest)
* **Maps:** Leaflet & OpenStreetMap (Reverse Geocoding)
* **Deployment:** Vercel (Edge Functions)

---

## 🚀 Setup & Local Development

### Prerequisites
* Node.js 20+
* npm 10+
* A Supabase project
* A Google AI Studio API Key

### Installation
```bash
# 1. Clone repository
git clone https://github.com/lavinpattnaikoffical-gif/Voltloop.git
cd Voltloop

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
```

### Configure Environment Variables
Add the following to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Google Gemini API
GEMINI_API_KEY=AIzaSy...
```

### Run the App
```bash
# Start local development server
npm run dev

# Open application
# http://localhost:3000
```

---

## ☁️ Production Deployment

This project is optimized for deployment on **Vercel**.

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Project Settings → Environment Variables**, add your Supabase and Gemini keys.
4. Deploy! The Next.js 16 App Router bundle will deploy seamlessly as Serverless Edge Functions.

---

## 🗺️ Live Features

- **Mobile-First UX**: Safe-area bottom navigation padding and responsive card layouts.
- **300+ Pre-Seeded Chargers**: Real community charger data spread across all Indian states.
- **Dynamic Dashboard**: Driver booking tracking and Host fleet management.
- **Secure Architecture**: Server-side validation and Supabase RLS policies protect user data.

---

© 2026 **VOLTLOOP** — Built for the future of decentralized mobility.
