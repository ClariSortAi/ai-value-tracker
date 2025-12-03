export type Source = 
  | "PRODUCT_HUNT"
  | "GITHUB"
  | "HACKER_NEWS"
  | "THERES_AN_AI"
  | "HUGGING_FACE"
  | "REDDIT"
  | "MANUAL";

export interface ScrapedProduct {
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  logo?: string;
  category?: string;
  tags: string[];
  launchDate: Date;
  source: Source;
  sourceUrl?: string;
  sourceId?: string;
  upvotes?: number;
  comments?: number;
  stars?: number;
  rawData?: Record<string, unknown>;
}

export interface ScraperResult {
  success: boolean;
  products: ScrapedProduct[];
  error?: string;
}

