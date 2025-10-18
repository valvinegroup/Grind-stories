'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Article, Subscriber, ContentBlock } from '../lib/types';
import { BlockType } from '../lib/types';
import { supabase } from '../lib/supabase';

type DbArticleRow = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string | null;
  publish_date: string | null;
  hero_image: string | null;
};

type DbContentBlockRow = {
  id: string;
  article_id: string;
  type: string;
  content: string | null;
  src: string | null;
  caption: string | null;
  title: string | null;
  company: string | null;
  logo_src: string | null;
  link: string | null;
  block_order: number;
};

const serializeArticle = (article: Article) => ({
  id: article.id,
  title: article.title,
  subtitle: article.subtitle,
  author: article.author,
  publish_date: article.publishDate,
  hero_image: article.heroImage || null,
});

const serializeContentBlocks = (articleId: string, blocks: ContentBlock[]) =>
  blocks.map((block, index) => {
    switch (block.type) {
      case BlockType.TEXT:
        return {
          id: block.id,
          article_id: articleId,
          block_order: index,
          type: BlockType.TEXT,
          content: block.content || null,
          src: null,
          caption: null,
          title: null,
          company: null,
          logo_src: null,
          link: null,
        };
      case BlockType.IMAGE:
        return {
          id: block.id,
          article_id: articleId,
          block_order: index,
          type: BlockType.IMAGE,
          content: null,
          src: block.src || null,
          caption: block.caption || null,
          title: null,
          company: null,
          logo_src: null,
          link: null,
        };
      case BlockType.AUDIO:
        return {
          id: block.id,
          article_id: articleId,
          block_order: index,
          type: BlockType.AUDIO,
          content: null,
          src: block.src || null,
          caption: null,
          title: block.title || null,
          company: null,
          logo_src: null,
          link: null,
        };
      case BlockType.SPONSORSHIP:
        return {
          id: block.id,
          article_id: articleId,
          block_order: index,
          type: BlockType.SPONSORSHIP,
          content: null,
          src: null,
          caption: null,
          title: null,
          company: block.company || null,
          logo_src: block.logoSrc || null,
          link: block.link || null,
        };
      default: {
        throw new Error('Unsupported block type encountered while serializing content blocks.');
      }
    }
  });

const deserializeContentBlock = (block: DbContentBlockRow): ContentBlock | null => {
  const type = block.type as BlockType;
  switch (type) {
    case BlockType.TEXT:
      return { id: block.id, type, content: block.content ?? '' };
    case BlockType.IMAGE:
      return { id: block.id, type, src: block.src ?? '', caption: block.caption ?? '' };
    case BlockType.AUDIO:
      return { id: block.id, type, src: block.src ?? '', title: block.title ?? '' };
    case BlockType.SPONSORSHIP:
      return {
        id: block.id,
        type,
        company: block.company ?? '',
        logoSrc: block.logo_src ?? '',
        link: block.link ?? '',
      };
    default:
      console.warn('Encountered unknown block type, skipping:', block);
      return null;
  }
};

const deserializeArticle = (article: DbArticleRow, blocks: DbContentBlockRow[]): Article => ({
  id: article.id,
  title: article.title ?? '',
  subtitle: article.subtitle ?? '',
  author: article.author ?? '',
  publishDate: article.publishdate ?? '',
  publishDate: article.publish_date ?? '',
  heroImage: article.hero_image ?? '',
  content: blocks
    .sort((a, b) => a.block_order - b.block_order)
    .map(deserializeContentBlock)
    .filter((block): block is ContentBlock => block !== null),
});

export const useSupabaseData = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      setLoading(false);
      return;
    }

    const { data: blocksData, error: blocksError } = await supabase
      .from('content_blocks')
      .select('*')
      .order('block_order', { ascending: true });
      
    if (blocksError) {
        console.error('Error fetching content blocks:', blocksError);
        setLoading(false);
        return;
    }

    const blocksByArticle = (blocksData ?? []).reduce<Record<string, DbContentBlockRow[]>>((acc, block) => {
      if (!acc[block.article_id]) acc[block.article_id] = [];
      acc[block.article_id].push(block as DbContentBlockRow);
      return acc;
    }, {});

    const assembledArticles = (articlesData ?? []).map((article) =>
      deserializeArticle(article as DbArticleRow, blocksByArticle[article.id] ?? [])
    );

    setArticles(assembledArticles);
    setLoading(false);
  }, []);
  
  const fetchSubscribers = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscribers')
      .select('name, email, subscribed_at')
      .order('subscribed_at', { ascending: false });

    if (error) {
      const columnMissing =
        error.code === '42703' || error.message?.toLowerCase().includes('column "name"');
      if (columnMissing) {
        console.warn(
          'Supabase subscribers table missing name column; falling back to email-only fetch. Run `ALTER TABLE subscribers ADD COLUMN name TEXT;` when convenient.'
        );
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('subscribers')
          .select('email, subscribed_at')
          .order('subscribed_at', { ascending: false });
        if (fallbackError) {
          console.error('Error fetching subscribers (fallback failed)', fallbackError);
          return;
        }
        const formattedFallback = (fallbackData ?? []).map((sub) => ({
          name: '',
          email: sub.email,
          subscribedAt: sub.subscribed_at,
        }));
        setSubscribers(formattedFallback);
        return;
      }
      console.error('Error fetching subscribers', error);
      return;
    }

    const formattedData = (data ?? []).map((sub) => ({
      name: sub.name ?? '',
      email: sub.email,
      subscribedAt: sub.subscribed_at,
    }));
    setSubscribers(formattedData);
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchSubscribers();
  }, [fetchArticles, fetchSubscribers]);

  const getArticle = useCallback(
    (id: string) => {
      return articles.find((article) => article.id === id);
    },
    [articles]
  );

  const updateArticle = useCallback(async (updatedArticle: Article) => {
    const { content } = updatedArticle;
    const articlePayload = serializeArticle(updatedArticle);

    const { error: articleError } = await supabase.from('articles').update(articlePayload).eq('id', updatedArticle.id);
    if (articleError) {
      console.error('Error updating article:', JSON.stringify(articleError, null, 2));
      return;
    }

    const { error: deleteError } = await supabase.from('content_blocks').delete().eq('article_id', updatedArticle.id);
    if (deleteError) {
      console.error('Error deleting old blocks:', JSON.stringify(deleteError, null, 2));
      return;
    }
    
    const blocksToInsert = serializeContentBlocks(updatedArticle.id, content);

    const { error: blocksError } = await supabase.from('content_blocks').insert(blocksToInsert);
    if (blocksError) return console.error('Error inserting new blocks:', blocksError);
    
    await fetchArticles();
  }, [fetchArticles]);
  
  const addArticle = useCallback(async (newArticle: Article) => {
      const { content } = newArticle;
      const articlePayload = serializeArticle(newArticle);
      
      console.log('Attempting to insert article:', articlePayload);
      const { error: articleError } = await supabase.from('articles').insert(articlePayload);
      if (articleError) {
        console.error('Error adding article:', articleError);
        console.error('Error details:', JSON.stringify(articleError, null, 2));
        return;
      }

      if (content.length > 0) {
        const blocksToInsert = serializeContentBlocks(newArticle.id, content);

        const { error: blocksError } = await supabase.from('content_blocks').insert(blocksToInsert);
        if (blocksError) return console.error('Error adding blocks:', blocksError);
      }
      
      await fetchArticles();
  }, [fetchArticles]);

  const deleteArticle = useCallback(async (articleId: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', articleId);
    if (error) console.error('Error deleting article:', error);
    else await fetchArticles();
  }, [fetchArticles]);

  const addSubscriber = useCallback(
    async ({ name, email }: { name: string; email: string }) => {
      const payload = { name: name || null, email };
      const { error } = await supabase.from('subscribers').upsert(payload, { onConflict: 'email' });
      if (error) {
        const columnMissing =
          error.code === '42703' || error.message?.toLowerCase().includes('column "name"');
        if (columnMissing) {
          console.warn(
            'Supabase subscribers table missing name column. Falling back to email-only insert. Run `ALTER TABLE subscribers ADD COLUMN name TEXT;` when convenient.'
          );
          const fallback = await supabase.from('subscribers').upsert({ email }, { onConflict: 'email' });
          if (fallback.error) {
            console.error('Error adding subscriber (fallback failed)', fallback.error);
            return;
          }
        } else {
          console.error('Error adding subscriber', error);
          return;
        }
      }
      await fetchSubscribers();
    },
    [fetchSubscribers]
  );

  return { articles, getArticle, updateArticle, addArticle, deleteArticle, subscribers, addSubscriber, loading };
};
