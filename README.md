# AI Future Brief Growth Agent

A full-stack command center for operating an AI-powered growth workflow for `@AIFutureBrief`.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Node.js + Express
- OpenAI Responses API integration with a resilient local fallback

## Structure

- `frontend/` - React application and dashboard UI
- `backend/` - Express API for metrics, trends, and content generation

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the backend:

   ```bash
   copy backend/.env.example backend/.env
   ```

3. Start both apps:

   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:5173` and proxies API requests to the backend on `http://localhost:8787`.

## Implemented now

- Dashboard metrics and growth chart
- AI content generator for viral tweets, news summaries, threads, and reply suggestions
- Simulated trend scanner
- Scheduler overview
- Dark "AI command center" interface

## Next slices

- Real X analytics ingestion
- Persistent scheduler and posting workflow
- Engagement queue and approval system
- History, saved drafts, and account memory
