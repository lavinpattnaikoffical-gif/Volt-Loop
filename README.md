# VOLTLOOP

> **"We don't build more chargers. We unlock the chargers that already exist."**
>
> *Community-powered EV charging marketplace turning underutilized home AC chargers into a distributed network.*

---

## Problem

Private EV chargers are underutilized while EV travelers struggle to find reliable charging.

* **Underutilized Asset**: Over 85% of EV owners install 3.3 kW, 7.2 kW, 11 kW, or 22 kW AC wallboxes at their residences. These chargers remain idle for 18–20 hours daily.
* **The Highway & Semi-Urban Infrastructure Gap**: Fast-charging infrastructure is sparse outside tier-1 expressways. EV travelers heading toward heritage destinations, tier-2/3 towns, or rural corridors (e.g., Pune–Satara–Kolhapur, Konkan) face severe range anxiety and broken public charging stations.

---

## Solution

A community-powered marketplace for private EV chargers:

1. **Hosts unlock idle driveway chargers**: Earn money during overnight hours with transparent reimbursement for electricity, host parking, and platform trust.
2. **Drivers reserve guaranteed overnight plug-in**: Wake up with 80–90% battery without waiting in commercial DC fast-charger queues.
3. **Decentralized & capital-light**: Unlocks existing grid-connected hardware without spending millions on new civil works or grid transformers.

---

## AI Architecture & Capabilities

VOLTLOOP adheres to the **Zero Hallucination Principle**: Deterministic physics and electrical engineering calculations are performed server-side *before* AI models rank or explain candidates.

* **AI ChargePilot (`/ai`)**:
  * Evaluates vehicle onboard AC charger limits, battery capacity, delta state-of-charge (SOC), and highway trajectory.
  * Deterministically computes required kWh, charging duration (at 90% onboard efficiency), and 3-part price.
  * Employs **Amazon Bedrock (Claude 3 Sonnet)** to rank candidates and provide human-friendly explanations.
  * Always presents the winner recommendation alongside **2 verified alternative options**.
* **AI-Assisted Charger Verification (`/host/list` & `/admin`)**:
  * Multi-point computer vision inspection analyzing host installation photos.
  * Verifies wallbox presence, tethered cable condition, Type 2 / 16A port, and earthing status.
  * Returns structured confidence score and summary; clearly labeled as *AI-Assisted Verification* (requiring administrative trust confirmation).
* **Natural-Language Charger Search (`/api/ai/natural-search`)**:
  * Parses conversational traveler queries (e.g., *"Find me a 7 kW charger near Satara tonight under ₹250"*) into structured database filters.
  * Queries actual database inventory—never fabricates nonexistent chargers.
* **Smart Community Pricing Recommendation**:
  * Suggests competitive host fees based on neighborhood amenities and regional electricity tariffs.

---

## AWS Architecture

```text
Next.js 16 (App Router)
    ↓
AWS Lambda / API Gateway
    ↓
Amazon DynamoDB (Chargers, Users, Vehicles, Bookings, Reviews)
    ↓
Amazon S3 (Charger Photos & Installation Evidence)
    ↓
Amazon Bedrock (Claude 3 Sonnet / Multimodal Analysis)
```

* **AWS Lambda & Function URLs / API Gateway**: Lightweight serverless compute for API endpoints.
* **Amazon DynamoDB**: Key-value and document store for low-latency operational queries.
* **Amazon S3**: Secure media bucket for host photo uploads.
* **Amazon Bedrock**: Foundation model inference (`anthropic.claude-3-sonnet-20240229-v1:0`).
* **CloudWatch**: Centralized logging and error tracking (no credentials logged).
* **Local / Demo Provider Fallback**: Seamless in-memory & file-backed fallback ensures 100% functionality without requiring active AWS credentials during local demos or hackathon judging.

---

## Demo Presentation Flow

Judges can execute the complete end-to-end presentation in under 3 minutes:

### 1. Driver Journey (00:00 - 01:20)
1. **Landing Page (`/`)**: Click **Try Demo (Judge Flow)** or **Find a Charger**.
2. **Explore Map (`/explore`)**: Observe 28+ community chargers across Pune, Satara, Kolhapur, Mumbai, Nagpur, and Bhubaneswar on the interactive Leaflet map.
3. **AI ChargePilot (`/ai?demo=1`)**:
   * Preloads: **Demo User (Aarav Sharma)**, **Tata Nexon EV Max (40.5 kWh)**, **22% Battery**, **Pune → Kolhapur**, **Budget: < ₹300**.
   * Run ChargePilot: System calculates 23.49 kWh needed, 7.2 kW max AC limit, 3h 37m charging time, and ₹285 total cost.
   * Review Bedrock AI rationale + **2 route alternatives**.
4. **Reserve Charger (`/booking/[chargerId]`)**:
   * Review transparent 3-part price: Electricity (₹223) + Host Fee (₹50) + Platform Fee (₹12) = ₹285.
   * Click **Confirm Booking** to generate real Booking ID (`VL-2026-XXXXX`).
5. **Driver Dashboard (`/dashboard`)**: Verify newly confirmed reservation appears live in upcoming bookings.

### 2. Host Journey (01:20 - 02:30)
1. Switch to **Host Mode** on Dashboard: Inspect earnings, sessions, and listed chargers.
2. Click **List My Charger (`/host/list`)**:
   * Complete 5-step wizard (Details → Location → Pricing → Photos → Review).
   * Upload charger image to trigger **AI-Assisted Photo Verification**.
   * Submit to publish charger into DynamoDB / marketplace.
3. Return to **Explore (`/explore`)**: Verify newly published charger instantly appears on the map.
4. **Admin Trust Console (`/admin`)**: Inspect the live AI ENGINE status card and verify pending community listings.

---

## Setup & Local Development

### Prerequisites
* Node.js 20+
* npm 10+

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-org/voltloop.git
cd voltloop

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Start local development server
npm run dev

# 5. Open application
# http://localhost:3000
```

---

## Environment Variables

Configure `.env.local` based on `.env.example`:

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# DynamoDB Tables
DYNAMODB_TABLE_USERS=voltloop-users-dev
DYNAMODB_TABLE_CHARGERS=voltloop-chargers-dev
DYNAMODB_TABLE_BOOKINGS=voltloop-bookings-dev
DYNAMODB_TABLE_REVIEWS=voltloop-reviews-dev

# S3 Media
S3_BUCKET_NAME=voltloop-media-dev

# AI Provider Settings
AI_PROVIDER=mock # Options: 'mock' | 'bedrock'
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

> **Zero Configuration Guarantee**: When AWS credentials are not provided or `AI_PROVIDER=mock` is set, VOLTLOOP activates its deterministic physics engine and mock Bedrock provider. All 20 routes, map pins, booking creations, and listings operate with full fidelity.

---

## Deployment

### 1. Vercel Deployment (Recommended for Hackathon Demo)
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Under **Project Settings → Environment Variables**, add the variables from `.env.example`.
4. Deploy: The Next.js 16 App Router bundle will deploy as Serverless Edge/Node.js Functions.

### 2. AWS Serverless Deployment
1. Build application: `npm run build`
2. Connect Lambda Function URLs or API Gateway to the Next.js standalone serverless output or deploy via AWS Amplify / AWS CDK.
3. Ensure the Lambda IAM execution role has permissions for `dynamodb:*`, `s3:*`, and `bedrock:InvokeModel`.

---

## Acceptance Test Suite

Run the full automated E2E and hardening test suite:

```bash
node scripts/test-e2e.mjs
```

Verifies:
1. `GET /api/ai/status` (AI Engine transparency card)
2. `GET /api/chargers` (28+ seeded chargers)
3. `POST /api/ai/chargepilot` (Deterministic engineering + Bedrock reasoning + 2 alternatives)
4. SOC mathematical consistency (Tata Nexon EV 40.5 kWh, 22% → 80%)
5. `POST /api/ai/verify-charger` (AI-assisted vision scan)
6. `POST /api/chargers` (Host listing persistence)
7. `POST /api/bookings` (Server-side price recalculation)
8. Duplicate booking protection (409 Conflict rejection)
9. Input validation (400 Bad Request on invalid battery SOC)
10. `GET /api/dashboard` (Live reflection of bookings & listings)

---

© 2026 **VOLTLOOP** — Built to Ship Hackathon.
