export type Source = 
  | "PRODUCT_HUNT"
  | "GITHUB"
  | "HACKER_NEWS"
  | "THERES_AN_AI"
  | "HUGGING_FACE"
  | "REDDIT"
  | "MANUAL"
  | "TAVILY"
  | "TAVILY_LIVE"
  | "FUTURETOOLS";

export interface ScrapedProduct {
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  logo?: string;
  category?: string;
  tags: string[];
  vendorName?: string;
  vendorType?: string;
  integrationHints?: string[];
  channelUseCases?: string[];
  channelSignals?: string[];
  launchDate: Date;
  source: Source;
  sourceUrl?: string;
  sourceId?: string;
  upvotes?: number;
  comments?: number;
  stars?: number;
  rawData?: Record<string, unknown>;
}

export interface ScraperResult<T = ScrapedProduct> {
  success: boolean;
  products: T[];
  error?: string;
}

export interface ScrapedOpenSourceTool {
  name: string;
  tagline?: string;
  description?: string;
  repoUrl?: string;
  spaceUrl?: string;
  logo?: string;
  runtime?: string;
  license?: string;
  tags: string[];
  launchDate: Date;
  source: Source;
  sourceUrl?: string;
  sourceId?: string;
  likes?: number;
  downloads?: number;
  author?: string;
  rawData?: Record<string, unknown>;
}

