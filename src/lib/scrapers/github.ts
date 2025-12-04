import { Octokit } from "@octokit/rest";
import { ScrapedProduct, ScraperResult } from "./types";

// AI-related search queries for GitHub - HIGH bar (10k+ stars) for quality
// These should be genuinely popular DEVELOPER TOOLS, not ML libraries or academic code
const AI_QUERIES = [
  "topic:ai-tools stars:>10000",
  "topic:developer-tools ai stars:>10000",
  "topic:llm stars:>10000",
  "topic:gpt stars:>10000",
  "topic:generative-ai stars:>10000",
  "langchain stars:>10000",
  "copilot stars:>10000",
];

// Blocklist patterns - reject repos matching these in name/description
const BLOCKLIST_PATTERNS = [
  /tutorial/i,
  /course/i,
  /learning/i,
  /demo/i,
  /example/i,
  /game/i,
  /thesis/i,
  /homework/i,
  /assignment/i,
  /lecture/i,
  /workshop/i,
  /awesome-/i,  // Awesome lists are not products
  /papers/i,
  /research/i,
  /experiment/i,
  /toy/i,
  /playground/i,
];

// Check if repo should be blocked based on name/description
function shouldBlockRepo(name: string, description: string | null): boolean {
  const text = `${name} ${description || ""}`.toLowerCase();
  return BLOCKLIST_PATTERNS.some(pattern => pattern.test(text));
}

export async function scrapeGitHub(): Promise<ScraperResult> {
  const token = process.env.GITHUB_TOKEN;
  
  const octokit = new Octokit({
    auth: token,
  });

  try {
    const allProducts: ScrapedProduct[] = [];
    const seenRepos = new Set<string>();

    // Search for AI-related repositories
    for (const query of AI_QUERIES.slice(0, 5)) { // Limit queries
      try {
        const response = await octokit.search.repos({
          q: query,
          sort: "updated",
          order: "desc",
          per_page: 20,
        });

        for (const repo of response.data.items) {
          // Skip if already seen
          if (seenRepos.has(repo.full_name)) continue;
          seenRepos.add(repo.full_name);

          // QUALITY FILTER: Require minimum 10k stars
          if ((repo.stargazers_count || 0) < 10000) continue;

          // QUALITY FILTER: Require homepage URL (real products have websites)
          if (!repo.homepage) continue;

          // QUALITY FILTER: Block tutorials, games, academic projects
          if (shouldBlockRepo(repo.name, repo.description)) {
            console.log(`[GitHub] Blocked: ${repo.name} (matches blocklist)`);
            continue;
          }

          // Extract topics/tags
          const tags = repo.topics?.slice(0, 5) || [];
          
          // GitHub repos go into "Developer Tools" category
          const category = "Developer Tools";

          allProducts.push({
            name: repo.name,
            tagline: repo.description?.slice(0, 150) || undefined,
            description: repo.description || undefined,
            website: repo.homepage, // Use actual homepage, not GitHub URL
            logo: repo.owner?.avatar_url,
            category,
            tags: tags.length > 0 ? [...tags, "Open Source", "Developer Tools"] : ["AI", "Open Source", "Developer Tools"],
            launchDate: new Date(repo.created_at || Date.now()),
            source: "GITHUB",
            sourceUrl: repo.html_url,
            sourceId: repo.id.toString(),
            stars: repo.stargazers_count || 0,
            upvotes: repo.stargazers_count || 0,
            rawData: {
              full_name: repo.full_name,
              language: repo.language,
              forks: repo.forks_count,
              watchers: repo.watchers_count,
              open_issues: repo.open_issues_count,
              license: repo.license?.name,
              updated_at: repo.updated_at,
            },
          });
        }

        // Rate limiting - GitHub API has strict limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`GitHub search error for query "${query}":`, error);
      }
    }

    // Sort by stars and limit
    const sortedProducts = allProducts
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 50);

    return {
      success: true,
      products: sortedProducts,
    };
  } catch (error) {
    console.error("GitHub scraper error:", error);
    return {
      success: false,
      products: getGitHubDemoProducts(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getGitHubDemoProducts(): ScrapedProduct[] {
  return [
    {
      name: "langchain",
      tagline: "Building applications with LLMs through composability",
      description: "LangChain is a framework for developing applications powered by language models.",
      website: "https://langchain.com",
      logo: "https://avatars.githubusercontent.com/u/126733545",
      category: "LLM Framework",
      tags: ["LLM", "AI", "NLP", "Framework"],
      launchDate: new Date("2022-10-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/langchain-ai/langchain",
      sourceId: "github-langchain",
      stars: 92000,
      upvotes: 92000,
    },
    {
      name: "ollama",
      tagline: "Get up and running with large language models locally",
      description: "Run Llama 2, Code Llama, and other models locally on your machine.",
      website: "https://ollama.ai",
      logo: "https://avatars.githubusercontent.com/u/151674099",
      category: "LLM",
      tags: ["LLM", "Local AI", "Llama", "Self-hosted"],
      launchDate: new Date("2023-07-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/ollama/ollama",
      sourceId: "github-ollama",
      stars: 85000,
      upvotes: 85000,
    },
    {
      name: "stable-diffusion-webui",
      tagline: "Stable Diffusion web UI",
      description: "A browser interface based on Gradio library for Stable Diffusion.",
      website: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
      logo: "https://avatars.githubusercontent.com/u/121283862",
      category: "AI Image Generation",
      tags: ["Stable Diffusion", "AI Art", "Image Generation"],
      launchDate: new Date("2022-08-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
      sourceId: "github-sd-webui",
      stars: 138000,
      upvotes: 138000,
    },
    {
      name: "transformers",
      tagline: "State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX",
      description: "Hugging Face Transformers provides thousands of pretrained models for NLP, computer vision, audio, and more.",
      website: "https://huggingface.co/transformers",
      logo: "https://avatars.githubusercontent.com/u/25720743",
      category: "Machine Learning",
      tags: ["NLP", "Deep Learning", "PyTorch", "TensorFlow"],
      launchDate: new Date("2018-10-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/huggingface/transformers",
      sourceId: "github-transformers",
      stars: 131000,
      upvotes: 131000,
    },
    {
      name: "llama.cpp",
      tagline: "LLM inference in C/C++",
      description: "Port of Facebook's LLaMA model in C/C++ for efficient inference on consumer hardware.",
      website: "https://github.com/ggerganov/llama.cpp",
      logo: "https://avatars.githubusercontent.com/u/1991296",
      category: "LLM",
      tags: ["LLM", "C++", "Inference", "Llama"],
      launchDate: new Date("2023-03-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/ggerganov/llama.cpp",
      sourceId: "github-llamacpp",
      stars: 65000,
      upvotes: 65000,
    },
  ];
}

