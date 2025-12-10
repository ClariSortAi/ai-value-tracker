import { Octokit } from "@octokit/rest";
import { ScrapedOpenSourceTool, ScraperResult } from "./types";

// AI-related search queries for GitHub - High bar (10k+ stars) for quality open source projects
// GitHub repos are now routed to OpenSourceTool table, not commercial Product table
const AI_QUERIES = [
  "topic:ai-tools stars:>10000",
  "topic:developer-tools ai stars:>10000",
  "topic:chatbot stars:>10000",
  "topic:code-generation stars:>10000",
  "ollama stars:>10000",
  "langchain stars:>10000",
];

// Blocklist patterns - reject repos matching these in name/description (comprehensive)
const BLOCKLIST_PATTERNS = [
  // Educational content - comprehensive
  /\b(tutorial|course|learning|lesson|lecture|workshop|bootcamp|education|teach|training)\b/i,
  /\b(step.by.step|from.scratch|how.to|guide|handbook|cookbook|cheatsheet)\b/i,
  /\b(implement|build|create|make).+(yourself|own|from|step)/i, // "Implement X from scratch"
  // Examples and demos
  /\b(demo|example|sample|template|boilerplate|starter|scaffold)\b/i,
  // Games (comprehensive)
  /\b(game|gaming|tower-defense|arcade|puzzle|rpg|roguelike|platformer|simulation|multiplayer)\b/i,
  // Academic/research
  /\b(thesis|homework|assignment|research|papers|academic|arxiv|conference)\b/i,
  // Lists and collections
  /\b(awesome-|awesome_|curated|collection|list-of|resources)\b/i,
  // Experiments and toys
  /\b(experiment|toy|playground|proof-of-concept|poc-|prototype)\b/i,
  // Pure infrastructure/libraries (no commercial layer)
  /\b(llm-inference|model-serving|inference-engine|rag-pipeline)\b/i,
  /\b(local-ai|local-llm|self-hosted|on-premise|offline)\b/i,
  /\b(webui|web-ui|frontend|ui-for|interface-for|client-for)\b/i,
  // Machine learning libraries/frameworks (not products)
  /^(pytorch|tensorflow|keras|scikit-learn|numpy|pandas)$/i,
  // Dataset repositories
  /\b(dataset|datasets|benchmark|benchmarks)\b/i,
  // Chat UI wrappers (not original products)
  /\b(chat|chatbot|assistant|agent).*(ui|interface|frontend|client)\b/i,
];

// Check if repo should be blocked based on name/description
function shouldBlockRepo(name: string, description: string | null): boolean {
  const text = `${name} ${description || ""}`.toLowerCase();
  return BLOCKLIST_PATTERNS.some(pattern => pattern.test(text));
}

export async function scrapeGitHub(): Promise<ScraperResult<ScrapedOpenSourceTool>> {
  const token = process.env.GITHUB_TOKEN;
  
  const octokit = new Octokit({
    auth: token,
  });

  try {
    const allTools: ScrapedOpenSourceTool[] = [];
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

          // QUALITY FILTER: Require minimum 10k stars for open source visibility
          if ((repo.stargazers_count || 0) < 10000) continue;

          // QUALITY FILTER: Block tutorials, games, academic projects
          if (shouldBlockRepo(repo.name, repo.description)) {
            console.log(`[GitHub] Blocked: ${repo.name} (matches blocklist)`);
            continue;
          }

          // Extract topics/tags
          const tags = repo.topics?.slice(0, 5) || [];
          
          // Extract license info
          const license = repo.license?.spdx_id || repo.license?.name || undefined;

          // Get owner/author
          const author = repo.owner?.login || undefined;

          allTools.push({
            name: repo.name,
            tagline: repo.description?.slice(0, 150) || undefined,
            description: repo.description || undefined,
            repoUrl: repo.html_url, // GitHub URL is the repo URL
            spaceUrl: repo.homepage || undefined, // Homepage is the space/demo URL if available
            logo: repo.owner?.avatar_url,
            runtime: repo.language || undefined, // Use programming language as "runtime"
            license,
            tags: tags.length > 0 ? [...tags, "Open Source"] : ["AI", "Open Source"],
            launchDate: new Date(repo.created_at || Date.now()),
            source: "GITHUB",
            sourceUrl: repo.html_url,
            sourceId: `github-${repo.id}`,
            likes: repo.stargazers_count || 0, // Stars = likes for open source
            downloads: repo.forks_count || 0, // Forks = downloads proxy for open source
            author,
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

    // Sort by likes (stars) and limit
    const sortedTools = allTools
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 50);

    return {
      success: true,
      products: sortedTools,
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

function getGitHubDemoProducts(): ScrapedOpenSourceTool[] {
  return [
    {
      name: "langchain",
      tagline: "Building applications with LLMs through composability",
      description: "LangChain is a framework for developing applications powered by language models.",
      repoUrl: "https://github.com/langchain-ai/langchain",
      spaceUrl: "https://langchain.com",
      logo: "https://avatars.githubusercontent.com/u/126733545",
      runtime: "Python",
      license: "MIT",
      tags: ["LLM", "AI", "NLP", "Framework", "Open Source"],
      launchDate: new Date("2022-10-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/langchain-ai/langchain",
      sourceId: "github-langchain",
      likes: 92000,
      downloads: 15000,
      author: "langchain-ai",
    },
    {
      name: "ollama",
      tagline: "Get up and running with large language models locally",
      description: "Run Llama 2, Code Llama, and other models locally on your machine.",
      repoUrl: "https://github.com/ollama/ollama",
      spaceUrl: "https://ollama.ai",
      logo: "https://avatars.githubusercontent.com/u/151674099",
      runtime: "Go",
      license: "MIT",
      tags: ["LLM", "Local AI", "Llama", "Self-hosted", "Open Source"],
      launchDate: new Date("2023-07-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/ollama/ollama",
      sourceId: "github-ollama",
      likes: 85000,
      downloads: 12000,
      author: "ollama",
    },
    {
      name: "stable-diffusion-webui",
      tagline: "Stable Diffusion web UI",
      description: "A browser interface based on Gradio library for Stable Diffusion.",
      repoUrl: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
      logo: "https://avatars.githubusercontent.com/u/121283862",
      runtime: "Python",
      license: "AGPL-3.0",
      tags: ["Stable Diffusion", "AI Art", "Image Generation", "Open Source"],
      launchDate: new Date("2022-08-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
      sourceId: "github-sd-webui",
      likes: 138000,
      downloads: 25000,
      author: "AUTOMATIC1111",
    },
    {
      name: "transformers",
      tagline: "State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX",
      description: "Hugging Face Transformers provides thousands of pretrained models for NLP, computer vision, audio, and more.",
      repoUrl: "https://github.com/huggingface/transformers",
      spaceUrl: "https://huggingface.co/transformers",
      logo: "https://avatars.githubusercontent.com/u/25720743",
      runtime: "Python",
      license: "Apache-2.0",
      tags: ["NLP", "Deep Learning", "PyTorch", "TensorFlow", "Open Source"],
      launchDate: new Date("2018-10-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/huggingface/transformers",
      sourceId: "github-transformers",
      likes: 131000,
      downloads: 20000,
      author: "huggingface",
    },
    {
      name: "llama.cpp",
      tagline: "LLM inference in C/C++",
      description: "Port of Facebook's LLaMA model in C/C++ for efficient inference on consumer hardware.",
      repoUrl: "https://github.com/ggerganov/llama.cpp",
      logo: "https://avatars.githubusercontent.com/u/1991296",
      runtime: "C++",
      license: "MIT",
      tags: ["LLM", "C++", "Inference", "Llama", "Open Source"],
      launchDate: new Date("2023-03-01"),
      source: "GITHUB",
      sourceUrl: "https://github.com/ggerganov/llama.cpp",
      sourceId: "github-llamacpp",
      likes: 65000,
      downloads: 8000,
      author: "ggerganov",
    },
  ];
}

