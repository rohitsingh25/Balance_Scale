# 🚀 Hosting & Deployment Guide

Deploy **Balance Scale** with the backend on **Render** and the frontend on **Vercel**.

---

## Architecture

```
┌──────────────────┐         API calls         ┌──────────────────┐
│   Vercel          │  ───────────────────────►  │   Render          │
│   (Frontend)      │                            │   (Backend)       │
│   React + Vite    │  ◄───────────────────────  │   Flask + Gunicorn│
│                   │        JSON responses      │                   │
└──────────────────┘                            └──────────────────┘
```

---

## Step 1: Deploy Backend on Render

### 1.1 Create a Render Account
Go to [render.com](https://render.com) and sign up (free tier available).

### 1.2 Create a New Web Service

1. Click **New** → **Web Service**
2. Connect your **GitHub repo** (`rohitsingh25/Balance_Scale`)
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `balance-scale-api` (or any name) |
| **Region** | Pick the closest to you |
| **Branch** | `main` |
| **Root Directory** | *(leave empty — root of repo)* |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app` |
| **Plan** | Free |

4. Click **Create Web Service**

### 1.3 Note Your Render URL
After deployment, Render will give you a URL like:
```
https://balance-scale-api.onrender.com
```
**Copy this URL** — you'll need it for Vercel.

### 1.4 Verify Backend is Running
Visit: `https://your-app-name.onrender.com/health`

You should see:
```json
{"status": "ok"}
```

> **Note:** Render free tier spins down after 15 minutes of inactivity. First request after idle may take ~30 seconds to wake up.

---

## Step 2: Deploy Frontend on Vercel

### 2.1 Create a Vercel Account
Go to [vercel.com](https://vercel.com) and sign up with GitHub.

### 2.2 Import Project

1. Click **Add New** → **Project**
2. Select your **GitHub repo** (`rohitsingh25/Balance_Scale`)
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` ← **Important!** |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 2.3 Set Environment Variable

Before clicking **Deploy**, add this environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-app-name.onrender.com` |

> Replace with your **actual Render URL** from Step 1.3 (no trailing slash).

4. Click **Deploy**

### 2.4 Note Your Vercel URL
After deployment, Vercel will give you a URL like:
```
https://rosybalance.vercel.app
```

---

## Step 3: Connect Backend CORS

Go back to **Render Dashboard** and add an environment variable:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://rosybalance.vercel.app` |

> Replace with your **actual Vercel URL** (no trailing slash).

Render will auto-redeploy with the updated CORS settings.

---

## ✅ Done!

Your game should now be live:
- **Frontend**: `https://balance-scale.vercel.app`
- **Backend**: `https://balance-scale-api.onrender.com`

---

## Quick Reference

### Files Added/Modified for Deployment

| File | Purpose |
|------|---------|
| `render.yaml` | Render blueprint (optional one-click deploy) |
| `requirements.txt` | Added `gunicorn` for production server |
| `app.py` | Dynamic CORS + `/health` endpoint |
| `frontend/vercel.json` | Vercel SPA routing config |
| `frontend/.env.example` | Reference for env variable |
| `frontend/src/App.jsx` | Uses `VITE_API_URL` for API calls |

### Environment Variables

| Where | Key | Value |
|-------|-----|-------|
| **Vercel** | `VITE_API_URL` | Your Render backend URL |
| **Render** | `FRONTEND_URL` | Your Vercel frontend URL |

### Local Development (unchanged)

```bash
# Terminal 1 — Backend
python3 app.py

# Terminal 2 — Frontend
npm run frontend
```
Local dev still uses Vite proxy (no env vars needed).

---

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` on Render matches your exact Vercel URL
- No trailing slash (✅ `https://app.vercel.app` not ❌ `https://app.vercel.app/`)

### API Not Responding
- Render free tier sleeps after 15 min idle → first request takes ~30s
- Check Render logs in the dashboard

### Build Failing on Vercel
- Ensure **Root Directory** is set to `frontend`
- Ensure `VITE_API_URL` is set (without trailing slash)

### Blank Page on Vercel
- The `vercel.json` rewrites handle SPA routing
- Check browser console for errors
