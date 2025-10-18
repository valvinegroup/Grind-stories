
import { useState, useCallback } from 'react';
import type { Article, ContentBlock } from '../types';
import { BlockType } from '../types';

const initialArticles: Article[] = [
  {
    id: 'the-art-of-timeless-style',
    title: 'The Art of Timeless Style',
    subtitle: 'Cultivating a wardrobe that transcends trends and seasons.',
    author: 'A. Vanderbilt',
    publishDate: 'October 12, 2023',
    heroImage: 'https://picsum.photos/1200/800?grayscale&random=1',
    content: [
      {
        id: '1',
        type: BlockType.TEXT,
        content: `<p>In a world saturated with fleeting trends and fast fashion, the pursuit of timeless style has become a quiet rebellion. It is not about being noticed, but about being remembered. It is the art of curating a life, and a wardrobe, that speaks of quality, heritage, and an unwavering sense of self. This philosophy, often associated with the 'old money' aesthetic, is less about wealth and more about wisdom—the wisdom to invest in pieces that endure, both in craftsmanship and in character.</p>`,
      },
      {
        id: '2',
        type: BlockType.IMAGE,
        src: 'https://picsum.photos/1000/700?grayscale&random=2',
        caption: 'A well-tailored coat is the cornerstone of any timeless wardrobe.',
      },
      {
        id: '3',
        type: BlockType.TEXT,
        content: `<h2>The Pillars of Enduring Elegance</h2><p>The foundation of this aesthetic rests on several key pillars. First, a neutral color palette: think beiges, creams, navies, and charcoals. These hues are versatile, sophisticated, and create a cohesive look with minimal effort. Second, natural fabrics are paramount. Wool, cashmere, linen, and silk not only feel luxurious but also age gracefully, developing a unique patina over time. Finally, the focus is on silhouette and fit rather than embellishment. A perfectly tailored blazer or a simple, well-draped dress makes a more powerful statement than any logo-emblazoned accessory.</p>`,
      },
       {
        id: '4',
        type: BlockType.SPONSORSHIP,
        company: 'Heirloom Watches Co.',
        logoSrc: 'https://picsum.photos/200/200?grayscale&random=10',
        link: '#',
      }
    ],
  },
  {
    id: 'on-literature-and-legacy',
    title: 'On Literature and Legacy',
    subtitle: 'The enduring power of a well-stocked library.',
    author: 'E. Hemingway',
    publishDate: 'September 28, 2023',
    heroImage: 'https://picsum.photos/1200/800?grayscale&random=3',
    content: [
      {
        id: '1',
        type: BlockType.TEXT,
        content: `<p>A home's character is often best judged not by its architecture, but by the contents of its library. A collection of books is a map of the soul, a legacy of curiosity passed down through generations. In the quiet solitude of a reading nook, surrounded by the wisdom of ages, one finds a connection to the past and a beacon for the future. The scent of old paper and leather is the perfume of heritage itself.</p>`,
      },
    ],
  },
];

export const useMockData = () => {
  const [articles, setArticles] = useState<Article[]>(initialArticles);

  const getArticle = useCallback(
    (id: string) => {
      return articles.find((article) => article.id === id);
    },
    [articles]
  );

  const updateArticle = useCallback((updatedArticle: Article) => {
    setArticles((prevArticles) =>
      prevArticles.map((article) =>
        article.id === updatedArticle.id ? updatedArticle : article
      )
    );
  }, []);
  
  const addArticle = useCallback((newArticle: Article) => {
      setArticles(prev => [newArticle, ...prev]);
  }, []);

  return { articles, getArticle, updateArticle, addArticle };
};
