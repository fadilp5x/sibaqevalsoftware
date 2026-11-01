# SIBAQ '26 Aliyah Assessment Hub

A gamified AI assessment platform designed for SIBAQ '26 Aliyah Kulliyyah candidates. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Duolingo-inspired tactile UI, MongoDB (Mongoose), NVIDIA Nemotron AI with Firecrawl live search fusion, pure Web Audio effects, public shareable links, and real-time coordinator dashboard synchronization.

---

## 🚀 Features

- **Duolingo-Inspired Tactile UI:** Warm Alabaster theme, pure white cards, 3D tactile buttons (`border-b-4 active:translate-y-[2px]`), vibrant academic color accents (Emerald, Sky, Amber, Purple).
- **Official SIBAQ '26 Programs Pre-Seeded:**
  - `AX40 - Mr. ENGLISH` (Candidate: Sahal)
  - `AN35 - LOGICAL REASONING` (Candidates: Ashif KC, Muhammed)
  - `AX39 - CIVIC QUEST` (Candidate: Zidhan)
  - `AS18 - BIZ QUIZ` (Candidate: Sinan P)
- **Multi-AI Engine:** NVIDIA Developer NIM (`nvidia/nemotron-3.5-bolt-e4b`) + OrcaRouter DeepSeek fallback + Firecrawl live web citations for legal and business questions.
- **Adaptive Question Generator:** 60% targeted at candidate weaknesses with anti-duplication registry.
- **Pure Web Audio Synthesizer:** Ascending chime, wrong buzzer, fanfare chord, and canvas confetti without external MP3 files.
- **Public Shareable Quiz Links:** `/quiz/[quizId]` with instant WhatsApp/clipboard sharing.
- **Live Coordinator Dashboard:** Auto-syncs attendee submissions every 20s with manual sync button and live activity stream.
- **Database Reset Endpoint:** `POST /api/reset` and `scripts/reset-db.js` to clear test submissions and restore clean rosters anytime.

---

## ⚡ Deployment on Vercel

### Step 1: Upload / Push to GitHub
1. Create a repository on GitHub (e.g. `https://github.com/new` named `fedex-sibaq` or `sibaq26-hub`).
2. Push this project code:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New..."** $\to$ **"Project"**.
2. Select your imported GitHub repository.
3. In **Environment Variables**, add the following 4 variables:

| Variable Name | Value |
|---|---|
| `MONGODB_URI` |  |
| `NVIDIA_API_KEY` | |
| `ORCAROUTER_API_KEY` | |
| `FIRECRAWL_API_KEY` |  |

4. Click **Deploy**. Vercel will install dependencies, build the Next.js App Router project, and provide your live URL!

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
