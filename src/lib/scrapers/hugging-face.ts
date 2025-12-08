import { ScrapedOpenSourceTool, ScraperResult } from "./types";

const HF_SPACES_API = "https://huggingface.co/api/spaces";
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || process.env.HF_TOKEN || "";

interface HuggingFaceSpace {
  id: string; // e.g. owner/space-name
  cardData?: {
    title?: string;
    subtitle?: string;
    description?: string;
    thumbnail?: string;
    license?: string;
  };
  likes?: number;
  downloads?: number;
  tags?: string[];
  author?: string;
  sdk?: string;
  runtime?: {
    hardware?: string;
    python_version?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  lastModified?: string;
  private?: boolean;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (HF_TOKEN) {
    headers.Authorization = `Bearer ${HF_TOKEN}`;
  }

  return headers;
}

export async function scrapeHuggingFaceSpaces(
  limit: number = 100
): Promise<ScraperResult<ScrapedOpenSourceTool>> {
  try {
    const url = `${HF_SPACES_API}?limit=${limit}&sort=likes&full=1`;
    const res = await fetch(url, { headers: buildHeaders(), cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Hugging Face API returned ${res.status}`);
    }

    const spaces = (await res.json()) as HuggingFaceSpace[];

    const products: ScrapedOpenSourceTool[] = spaces
      .filter((space) => !space.private)
      .map((space) => {
        const [owner] = space.id?.split("/") ?? [];
        const spaceUrl = `https://huggingface.co/spaces/${space.id}`;
        const title = space.cardData?.title || space.id;
        const description =
          space.cardData?.description || space.cardData?.subtitle || "";

        return {
          name: title,
          tagline: space.cardData?.subtitle || undefined,
          description: description || undefined,
          repoUrl: spaceUrl,
          spaceUrl,
          logo: space.cardData?.thumbnail || undefined,
          runtime: space.runtime?.hardware || space.sdk,
          license: space.cardData?.license,
          tags: space.tags || [],
          launchDate: new Date(
            space.createdAt ||
              space.updatedAt ||
              space.lastModified ||
              Date.now()
          ),
          source: "HUGGING_FACE",
          sourceUrl: spaceUrl,
          sourceId: space.id,
          likes: space.likes || 0,
          downloads: space.downloads || 0,
          author: owner,
          rawData: {
            sdk: space.sdk,
            runtime: space.runtime,
          },
        };
      });

    return {
      success: true,
      products,
    };
  } catch (error) {
    console.error("[Scraper] Hugging Face error", error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

