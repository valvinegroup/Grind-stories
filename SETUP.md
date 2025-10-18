# Grind Stories - Next.js Setup Guide

## ✅ Migration Complete!

Your Grind Stories app has been successfully refactored from Vite to Next.js with **ALL styling preserved exactly**.

---

## 🔧 Step 1: Create Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://spwlcmkzqzbhtlapiimy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwd2xjbWt6cXpiaHRsYXBpaW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTM0OTEsImV4cCI6MjA3NjM2OTQ5MX0.qlbUKYtXXmUfvsgO8bWRYpFc8AkFDpwlHXKw-7KiagE

# Optional: Only needed if you want AI content generation
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

**To create this file manually:**
1. Open Notepad
2. Paste the content above
3. Save as `.env.local` in `C:\Users\HP\CascadeProjects\grind-stories-nextjs\`

---

## 🗄️ Step 2: Set Up Supabase Database

Go to your Supabase project dashboard and run this SQL:

```sql
-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT NOT NULL,
  publish_date TEXT NOT NULL,
  hero_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_blocks table
CREATE TABLE IF NOT EXISTS content_blocks (
  id TEXT NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  src TEXT,
  caption TEXT,
  title TEXT,
  company TEXT,
  logo_src TEXT,
  link TEXT,
  block_order INTEGER NOT NULL,
  PRIMARY KEY (id, article_id)
);

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_blocks_article_id ON content_blocks(article_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_order ON content_blocks(article_id, block_order);
CREATE INDEX IF NOT EXISTS idx_subscribers_date ON subscribers(subscribed_at DESC);
```

---

## 🚀 Step 3: Run the Development Server

```bash
cd C:\Users\HP\CascadeProjects\grind-stories-nextjs
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## 📋 Admin Access

- **URL:** http://localhost:3000/admin
- **Email:** admin@grindstories.com
- **Password:** the beast, 123

---

## 🎨 What's Preserved

✅ **Exact same styling** - All Tailwind classes, colors, fonts
✅ **Same components** - EmailCapture, ArticleEditor, AudioRecorder
✅ **Same functionality** - Article management, subscribers, AI generation
✅ **Same database structure** - Supabase integration unchanged

---

## 🆕 What's Improved with Next.js

✅ Better SEO (Server-Side Rendering)
✅ Faster page loads
✅ Built-in routing (no React Router needed)
✅ Optimized production builds
✅ Better deployment options (Vercel, Netlify, etc.)

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Go to https://netlify.com
3. Import your repository
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Add environment variables
7. Deploy!

---

## 🔍 Project Structure

```
grind-stories-nextjs/
├── app/
│   ├── page.tsx              # Home page
│   ├── article/[id]/page.tsx # Article detail page
│   ├── admin/page.tsx        # Admin login
│   ├── dashboard/page.tsx    # Admin dashboard
│   ├── editor/[id]/page.tsx  # Article editor
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── ArticleEditor.tsx
│   ├── AudioRecorder.tsx
│   ├── EmailCapture.tsx
│   └── icons.tsx
├── hooks/
│   └── useSupabaseData.ts
├── lib/
│   ├── auth-context.tsx
│   ├── gemini.ts
│   ├── supabase.ts
│   └── types.ts
└── .env.local               # Environment variables
```

---

## ❓ Troubleshooting

**Issue:** "Supabase environment variables are not set"
- **Solution:** Make sure `.env.local` exists and has the correct variables

**Issue:** "No articles showing"
- **Solution:** Run the SQL schema in Supabase to create tables

**Issue:** Port 3000 already in use
- **Solution:** Run `npm run dev -- -p 3001` to use a different port

---

## 📝 Notes

- The Gemini API key is **optional** - the app works without it (you just won't have AI content generation)
- All images are stored as base64 in the database
- Audio recordings are also stored as base64
- The admin password is hardcoded - consider using proper authentication in production
