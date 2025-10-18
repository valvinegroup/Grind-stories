
import { useState, useCallback, useEffect } from 'react';
import type { Article, Subscriber, ContentBlock } from '../types';
import { supabase } from '../services/supabaseClient';

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

    const assembledArticles = articlesData.map(article => {
        const content = blocksData
            .filter(block => block.article_id === article.id)
            .map(block => {
                 // Reconstruct the block based on its type
                 const { article_id, block_order, ...rest } = block;
                 return rest as ContentBlock;
            });
        return { ...article, content };
    });

    setArticles(assembledArticles);
    setLoading(false);
  }, []);
  
  const fetchSubscribers = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscribers')
      // FIX: Corrected Supabase select syntax for column aliasing.
      .select('email, subscribedAt:subscribed_at')
      .order('subscribed_at', { ascending: false });
    if (error) console.error('Error fetching subscribers', error);
    else setSubscribers(data as Subscriber[]);
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
    const { content, ...articleData } = updatedArticle;
    
    const { error: articleError } = await supabase.from('articles').update(articleData).eq('id', articleData.id);
    if (articleError) return console.error('Error updating article:', articleError);

    const { error: deleteError } = await supabase.from('content_blocks').delete().eq('article_id', articleData.id);
    if (deleteError) return console.error('Error deleting old blocks:', deleteError);
    
    const blocksToInsert = content.map((block, index) => ({
        ...block,
        article_id: articleData.id,
        block_order: index,
    }));

    const { error: blocksError } = await supabase.from('content_blocks').insert(blocksToInsert);
    if (blocksError) return console.error('Error inserting new blocks:', blocksError);
    
    await fetchArticles(); // Refresh data
  }, [fetchArticles]);
  
  const addArticle = useCallback(async (newArticle: Article) => {
      const { content, ...articleData } = newArticle;
      
      const { error: articleError } = await supabase.from('articles').insert(articleData);
      if (articleError) return console.error('Error adding article:', articleError);

      if (content.length > 0) {
        const blocksToInsert = content.map((block, index) => ({
            ...block,
            article_id: articleData.id,
            block_order: index,
        }));

        const { error: blocksError } = await supabase.from('content_blocks').insert(blocksToInsert);
        if (blocksError) return console.error('Error adding blocks:', blocksError);
      }
      
      await fetchArticles(); // Refresh data
  }, [fetchArticles]);

  const deleteArticle = useCallback(async (articleId: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', articleId);
    if (error) console.error('Error deleting article:', error);
    else await fetchArticles(); // Refresh data
  }, [fetchArticles]);

  const addSubscriber = useCallback(async (email: string) => {
    // FIX: Replaced deprecated .insert with onConflict with the .upsert method for handling duplicate entries.
    const { error } = await supabase.from('subscribers').upsert({ email }, { onConflict: 'email' });
    if(error) console.error('Error adding subscriber', error);
    else await fetchSubscribers();
  }, [fetchSubscribers]);

  return { articles, getArticle, updateArticle, addArticle, deleteArticle, subscribers, addSubscriber, loading };
};