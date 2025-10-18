-- Grind Stories - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

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

-- Enable Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to articles" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to content_blocks" ON content_blocks
  FOR SELECT USING (true);

-- Create policies for authenticated write access (you can customize this)
CREATE POLICY "Allow authenticated insert on articles" ON articles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on articles" ON articles
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on articles" ON articles
  FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert on content_blocks" ON content_blocks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on content_blocks" ON content_blocks
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on content_blocks" ON content_blocks
  FOR DELETE USING (true);

-- Subscribers policies
CREATE POLICY "Allow public insert on subscribers" ON subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on subscribers" ON subscribers
  FOR SELECT USING (true);
