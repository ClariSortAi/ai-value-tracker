import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PRODUCTS = [
  {
    name: "ChatGPT",
    slug: "chatgpt",
    tagline: "Conversational AI assistant by OpenAI",
    description: "ChatGPT is an AI-powered chatbot developed by OpenAI. It uses large language models to engage in conversational dialogue and assist with various tasks including writing, analysis, coding, and more.",
    website: "https://chat.openai.com",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1200px-ChatGPT_logo.svg.png",
    category: "AI Assistant",
    tags: ["AI", "Chatbot", "LLM", "OpenAI", "GPT"],
    targetRoles: ["marketing", "sales", "product", "engineering", "design", "operations", "hr"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-chatgpt",
    upvotes: 15000,
    comments: 2300,
    launchDate: new Date("2024-11-15"),
    score: { functionalCoverage: 9, usability: 9, innovation: 8, pricing: 7, integration: 8, security: 7, confidence: 0.9 },
  },
  {
    name: "Claude",
    slug: "claude",
    tagline: "AI assistant that's helpful, harmless, and honest",
    description: "Claude is an AI assistant created by Anthropic to be helpful, harmless, and honest. It excels at analysis, writing, coding, math, and maintaining nuanced conversations.",
    website: "https://claude.ai",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Claude_AI.svg/1200px-Claude_AI.svg.png",
    category: "AI Assistant",
    tags: ["AI", "Assistant", "LLM", "Anthropic", "Safe AI"],
    targetRoles: ["marketing", "sales", "product", "engineering", "design", "operations"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-claude",
    upvotes: 8500,
    comments: 1200,
    launchDate: new Date("2024-11-20"),
    score: { functionalCoverage: 9, usability: 9, innovation: 9, pricing: 7, integration: 7, security: 9, confidence: 0.9 },
  },
  {
    name: "Cursor",
    slug: "cursor",
    tagline: "The AI-first code editor",
    description: "Cursor is a code editor built for pair-programming with AI. It features intelligent code completion, chat-based assistance, and the ability to edit code through natural language.",
    website: "https://cursor.com",
    logo: "https://www.cursor.com/brand/icon.svg",
    category: "Developer Tools",
    tags: ["AI", "Code Editor", "IDE", "Programming", "Copilot"],
    targetRoles: ["engineering", "product"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-cursor",
    upvotes: 12000,
    comments: 1800,
    launchDate: new Date("2024-11-25"),
    score: { functionalCoverage: 8, usability: 9, innovation: 9, pricing: 8, integration: 8, security: 7, confidence: 0.85 },
  },
  {
    name: "Midjourney",
    slug: "midjourney",
    tagline: "AI-powered image generation through Discord",
    description: "Midjourney is an AI program that creates images from natural language descriptions. Known for its artistic and stylized outputs, it operates primarily through Discord.",
    website: "https://midjourney.com",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Midjourney_Emblem.png/480px-Midjourney_Emblem.png",
    category: "Image Generation",
    tags: ["AI", "Image Generation", "Art", "Creative", "Discord"],
    targetRoles: ["marketing", "design"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-midjourney",
    upvotes: 18000,
    comments: 3200,
    launchDate: new Date("2024-10-01"),
    score: { functionalCoverage: 6, usability: 6, innovation: 10, pricing: 5, integration: 4, security: 6, confidence: 0.85 },
  },
  {
    name: "Perplexity AI",
    slug: "perplexity-ai",
    tagline: "AI-powered search engine with cited sources",
    description: "Perplexity is an AI search engine that provides accurate answers to questions with cited sources. It combines search with AI to deliver knowledge, not just links.",
    website: "https://perplexity.ai",
    logo: "https://www.perplexity.ai/favicon.ico",
    category: "AI Search",
    tags: ["AI", "Search", "Research", "Knowledge", "Citations"],
    targetRoles: ["marketing", "sales", "product", "engineering", "operations"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-perplexity",
    upvotes: 9500,
    comments: 1400,
    launchDate: new Date("2024-11-28"),
    score: { functionalCoverage: 7, usability: 9, innovation: 8, pricing: 8, integration: 6, security: 7, confidence: 0.85 },
  },
  {
    name: "Stable Diffusion",
    slug: "stable-diffusion",
    tagline: "Open-source AI image generation model",
    description: "Stable Diffusion is an open-source deep learning model that generates images from text descriptions. It can run locally and has spawned a large ecosystem of tools and interfaces.",
    website: "https://stability.ai",
    logo: "https://stability.ai/favicon.ico",
    category: "Image Generation",
    tags: ["AI", "Image Generation", "Open Source", "Deep Learning"],
    targetRoles: ["engineering", "design", "marketing"],
    source: "GITHUB",
    sourceId: "demo-stable-diffusion",
    stars: 138000,
    upvotes: 138000,
    launchDate: new Date("2024-09-15"),
    score: { functionalCoverage: 8, usability: 5, innovation: 9, pricing: 10, integration: 9, security: 6, confidence: 0.9 },
  },
  {
    name: "LangChain",
    slug: "langchain",
    tagline: "Building applications with LLMs through composability",
    description: "LangChain is a framework for developing applications powered by language models. It provides tools for prompt management, chains, agents, and memory.",
    website: "https://langchain.com",
    logo: "https://avatars.githubusercontent.com/u/126733545",
    category: "Developer Framework",
    tags: ["AI", "LLM", "Framework", "Python", "Development"],
    targetRoles: ["engineering"],
    source: "GITHUB",
    sourceId: "demo-langchain",
    stars: 92000,
    upvotes: 92000,
    launchDate: new Date("2024-08-10"),
    score: { functionalCoverage: 9, usability: 6, innovation: 8, pricing: 10, integration: 10, security: 7, confidence: 0.9 },
  },
  {
    name: "Ollama",
    slug: "ollama",
    tagline: "Get up and running with large language models locally",
    description: "Ollama allows you to run large language models locally on your machine. It supports various models including Llama 2, Mistral, and Code Llama.",
    website: "https://ollama.ai",
    logo: "https://ollama.ai/public/ollama.png",
    category: "Local AI",
    tags: ["AI", "LLM", "Local", "Self-hosted", "Privacy"],
    targetRoles: ["engineering", "operations"],
    source: "GITHUB",
    sourceId: "demo-ollama",
    stars: 85000,
    upvotes: 85000,
    launchDate: new Date("2024-10-20"),
    score: { functionalCoverage: 7, usability: 9, innovation: 8, pricing: 10, integration: 8, security: 9, confidence: 0.9 },
  },
  {
    name: "Hugging Face",
    slug: "hugging-face",
    tagline: "The AI community building the future",
    description: "Hugging Face is a platform for machine learning, featuring model hosting, datasets, and collaborative tools. It's home to thousands of pre-trained models and the Transformers library.",
    website: "https://huggingface.co",
    logo: "https://huggingface.co/front/assets/huggingface_logo.svg",
    category: "AI Platform",
    tags: ["AI", "ML", "Models", "Datasets", "Community"],
    targetRoles: ["engineering", "product"],
    source: "HUGGING_FACE",
    sourceId: "demo-huggingface",
    upvotes: 25000,
    launchDate: new Date("2024-07-01"),
    score: { functionalCoverage: 10, usability: 8, innovation: 9, pricing: 9, integration: 10, security: 8, confidence: 0.95 },
  },
  {
    name: "v0 by Vercel",
    slug: "v0-vercel",
    tagline: "Generate UI with AI",
    description: "v0 is a generative UI system by Vercel. Describe what you want to build in natural language, and v0 generates copy-and-paste React code using shadcn/ui.",
    website: "https://v0.dev",
    logo: "https://v0.dev/icon-dark.svg",
    category: "Code Generation",
    tags: ["AI", "UI", "Code Generation", "React", "Vercel"],
    targetRoles: ["engineering", "design", "product"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-v0",
    upvotes: 7500,
    comments: 980,
    launchDate: new Date("2024-11-30"),
    score: { functionalCoverage: 6, usability: 10, innovation: 9, pricing: 7, integration: 7, security: 7, confidence: 0.85 },
  },
  {
    name: "Replicate",
    slug: "replicate",
    tagline: "Run AI models with a cloud API",
    description: "Replicate lets you run open-source machine learning models with a cloud API. Deploy models in seconds and scale automatically.",
    website: "https://replicate.com",
    logo: "https://replicate.com/favicon.ico",
    category: "AI Infrastructure",
    tags: ["AI", "API", "ML Models", "Cloud", "Infrastructure"],
    targetRoles: ["engineering", "product"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-replicate",
    upvotes: 4200,
    comments: 520,
    launchDate: new Date("2024-10-05"),
    score: { functionalCoverage: 8, usability: 9, innovation: 7, pricing: 7, integration: 9, security: 7, confidence: 0.85 },
  },
  {
    name: "Runway",
    slug: "runway",
    tagline: "AI-powered creative tools for video",
    description: "Runway is a creative toolkit powered by AI. It offers tools for video generation, image editing, and creative workflows used by professional filmmakers and artists.",
    website: "https://runwayml.com",
    logo: "https://runwayml.com/favicon.ico",
    category: "Video Generation",
    tags: ["AI", "Video", "Creative", "Film", "Generation"],
    targetRoles: ["marketing", "design"],
    source: "THERES_AN_AI",
    sourceId: "demo-runway",
    upvotes: 6800,
    launchDate: new Date("2024-11-10"),
    score: { functionalCoverage: 8, usability: 8, innovation: 9, pricing: 5, integration: 7, security: 7, confidence: 0.85 },
  },
  {
    name: "Jasper",
    slug: "jasper",
    tagline: "AI copilot for enterprise marketing teams",
    description: "Jasper is an AI content platform designed for marketing teams. It helps create on-brand content at scale with templates, brand voice controls, and team collaboration features.",
    website: "https://jasper.ai",
    logo: "https://www.jasper.ai/favicon.ico",
    category: "Content Generation",
    tags: ["AI", "Marketing", "Content", "Copywriting", "Enterprise"],
    targetRoles: ["marketing", "sales"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-jasper",
    upvotes: 5200,
    comments: 680,
    launchDate: new Date("2024-12-01"),
    score: { functionalCoverage: 8, usability: 9, innovation: 7, pricing: 5, integration: 8, security: 8, confidence: 0.85 },
  },
  {
    name: "Notion AI",
    slug: "notion-ai",
    tagline: "AI assistant built into your workspace",
    description: "Notion AI is integrated directly into Notion, helping you write, brainstorm, edit, and summarize content within your existing workflow.",
    website: "https://notion.so/ai",
    logo: "https://www.notion.so/images/favicon.ico",
    category: "Productivity",
    tags: ["AI", "Productivity", "Writing", "Notes", "Collaboration"],
    targetRoles: ["marketing", "product", "operations", "hr"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-notion-ai",
    upvotes: 11000,
    comments: 1500,
    launchDate: new Date("2024-11-05"),
    score: { functionalCoverage: 7, usability: 10, innovation: 7, pricing: 7, integration: 9, security: 8, confidence: 0.9 },
  },
  {
    name: "Gong",
    slug: "gong",
    tagline: "Revenue AI platform for sales teams",
    description: "Gong captures and analyzes customer interactions to provide insights that help sales teams close more deals. AI-powered conversation intelligence for revenue growth.",
    website: "https://gong.io",
    logo: "https://www.gong.io/favicon.ico",
    category: "Sales Intelligence",
    tags: ["AI", "Sales", "Revenue", "Conversation Intelligence", "Analytics"],
    targetRoles: ["sales", "operations"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-gong",
    upvotes: 4800,
    comments: 420,
    launchDate: new Date("2024-10-25"),
    score: { functionalCoverage: 9, usability: 8, innovation: 8, pricing: 4, integration: 9, security: 9, confidence: 0.9 },
  },
  {
    name: "Figma AI",
    slug: "figma-ai",
    tagline: "AI-powered design tools in Figma",
    description: "Figma AI brings intelligent features to design workflows including auto-layout suggestions, asset generation, and design system recommendations.",
    website: "https://figma.com",
    logo: "https://static.figma.com/app/icon/1/favicon.ico",
    category: "Design Tools",
    tags: ["AI", "Design", "UI/UX", "Prototyping", "Collaboration"],
    targetRoles: ["design", "product", "engineering"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-figma-ai",
    upvotes: 8900,
    comments: 1100,
    launchDate: new Date("2024-11-22"),
    score: { functionalCoverage: 8, usability: 10, innovation: 8, pricing: 7, integration: 9, security: 8, confidence: 0.9 },
  },
  {
    name: "Otter.ai",
    slug: "otter-ai",
    tagline: "AI meeting assistant that records and transcribes",
    description: "Otter.ai automatically records, transcribes, and summarizes meetings. It integrates with Zoom, Teams, and Google Meet to capture everything.",
    website: "https://otter.ai",
    logo: "https://otter.ai/favicon.ico",
    category: "Meeting Assistant",
    tags: ["AI", "Meetings", "Transcription", "Notes", "Productivity"],
    targetRoles: ["sales", "product", "operations", "hr"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-otter",
    upvotes: 6200,
    comments: 780,
    launchDate: new Date("2024-10-15"),
    score: { functionalCoverage: 7, usability: 9, innovation: 7, pricing: 8, integration: 9, security: 7, confidence: 0.85 },
  },
  {
    name: "Copy.ai",
    slug: "copy-ai",
    tagline: "AI-powered marketing copy and content",
    description: "Copy.ai helps marketers create high-converting copy for ads, emails, social media, and more. Templates and workflows for every marketing need.",
    website: "https://copy.ai",
    logo: "https://www.copy.ai/favicon.ico",
    category: "Content Generation",
    tags: ["AI", "Copywriting", "Marketing", "Content", "Ads"],
    targetRoles: ["marketing", "sales"],
    source: "PRODUCT_HUNT",
    sourceId: "demo-copyai",
    upvotes: 7100,
    comments: 890,
    launchDate: new Date("2024-11-18"),
    score: { functionalCoverage: 7, usability: 9, innovation: 6, pricing: 8, integration: 7, security: 7, confidence: 0.85 },
  },
];

function calculateCompositeScore(scores: {
  functionalCoverage: number;
  usability: number;
  innovation: number;
  pricing: number;
  integration: number;
  security: number;
}): number {
  const weights = {
    functionalCoverage: 0.2,
    usability: 0.2,
    innovation: 0.2,
    pricing: 0.15,
    integration: 0.15,
    security: 0.1,
  };

  const weighted =
    scores.functionalCoverage * weights.functionalCoverage +
    scores.usability * weights.usability +
    scores.innovation * weights.innovation +
    scores.pricing * weights.pricing +
    scores.integration * weights.integration +
    scores.security * weights.security;

  return Math.round(weighted * 10);
}

async function main() {
  console.log("🌱 Seeding database...");
  
  // First, delete all existing products and scores
  console.log("🗑️ Deleting existing data...");
  await prisma.score.deleteMany();
  await prisma.product.deleteMany();
  console.log("✅ Existing data deleted");

  for (const data of DEMO_PRODUCTS) {
    const { score, tags, targetRoles, launchDate, ...productData } = data;

    // Create product (fresh, no upsert needed)
    const product = await prisma.product.create({
      data: {
        ...productData,
        tags: JSON.stringify(tags),
        targetRoles: JSON.stringify(targetRoles),
        launchDate,
      },
    });

    const compositeScore = calculateCompositeScore(score);
    const reasoning = JSON.stringify({
      functionalCoverage: `Covers ${score.functionalCoverage >= 8 ? "comprehensive" : "moderate"} range of use cases.`,
      usability: `${score.usability >= 8 ? "Excellent" : "Good"} user experience and onboarding.`,
      innovation: `${score.innovation >= 8 ? "Highly innovative" : "Moderately innovative"} approach to the problem.`,
      pricing: `${score.pricing >= 8 ? "Excellent value" : "Fair pricing"} for the features offered.`,
      integration: `${score.integration >= 8 ? "Extensive" : "Adequate"} API and integration options.`,
      security: `${score.security >= 8 ? "Strong" : "Reasonable"} security practices.`,
    });

    await prisma.score.create({
      data: {
        productId: product.id,
        ...score,
        compositeScore,
        reasoning,
      },
    });

    console.log(`✅ Created: ${product.name} (Score: ${compositeScore}, Roles: ${targetRoles.join(", ")})`);
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
