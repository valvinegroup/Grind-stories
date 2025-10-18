
export enum BlockType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  SPONSORSHIP = 'sponsorship',
}

export interface TextBlock {
  id: string;
  type: BlockType.TEXT;
  content: string; 
}

export interface ImageBlock {
  id: string;
  type: BlockType.IMAGE;
  src: string; 
  caption: string;
}

export interface AudioBlock {
  id: string;
  type: BlockType.AUDIO;
  src: string;
  title: string;
}

export interface SponsorshipBlock {
  id: string;
  type: BlockType.SPONSORSHIP;
  company: string;
  logoSrc: string; 
  link: string;
}

export type ContentBlock = TextBlock | ImageBlock | AudioBlock | SponsorshipBlock;

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  publishDate: string;
  heroImage: string;
  content: ContentBlock[];
}

export interface Subscriber {
  name: string;
  email: string;
  subscribedAt: string;
}
