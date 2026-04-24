import OpenAI from "openai";
import { db } from "./db";
import { blogPosts } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const openai = new OpenAI();

const BLOG_TOPICS = [
  {
    category: "blockchain",
    topics: [
      "What is a Trust Layer and Why Traditional Blockchain Falls Short",
      "Understanding Proof-of-Authority: Speed Without Sacrifice",
      "The Evolution of Blockchain Consensus Mechanisms",
      "Why Enterprise Blockchain Needs Verified Identity",
      "Blockchain Beyond Cryptocurrency: Real Business Applications",
    ]
  },
  {
    category: "defi",
    topics: [
      "DeFi Explained: Decentralized Finance for Beginners",
      "Liquidity Pools: How They Work and Why They Matter",
      "Staking vs Trading: Which Strategy is Right for You",
      "Understanding Token Economics: Beyond Supply and Demand",
      "The Future of Cross-Chain Bridges",
    ]
  },
  {
    category: "signal",
    topics: [
      "Signal Token: Not a Cryptocurrency, A Trust Transmission",
      "Why Signal is Different from Traditional Crypto Tokens",
      "The Signal Ecosystem: Building Trust at Scale",
      "From Speculation to Utility: Redefining Digital Assets",
      "Signal Staking: Earn While You Secure the Network",
    ]
  },
  {
    category: "security",
    topics: [
      "Blockchain Security Best Practices for 2025",
      "Smart Contract Auditing: What Every Project Needs",
      "Protecting Your Digital Assets: A Complete Guide",
      "Understanding Wallet Security: Hot vs Cold Storage",
      "The Role of Validators in Network Security",
    ]
  },
  {
    category: "education",
    topics: [
      "Getting Started with Blockchain: A Complete Beginner's Guide",
      "Understanding Gas Fees Across Different Networks",
      "How to Read a Block Explorer Like a Pro",
      "The Difference Between Layer 1 and Layer 2 Solutions",
      "Web3 Terminology: A Comprehensive Glossary",
    ]
  }
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export async function generateBlogPost(topic?: string, category?: string): Promise<any> {
  const selectedCategory = category || BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)].category;
  const categoryData = BLOG_TOPICS.find(c => c.category === selectedCategory) || BLOG_TOPICS[0];
  const selectedTopic = topic || categoryData.topics[Math.floor(Math.random() * categoryData.topics.length)];

  const systemPrompt = `You are an expert content writer for DarkWave, a blockchain trust layer platform. 
Write engaging, informative blog posts that educate readers about blockchain, DeFi, and the DarkWave ecosystem.

Guidelines:
- Write in a professional but accessible tone
- Explain complex concepts simply without being condescending
- Include practical examples and real-world applications
- Naturally mention Trust Layer's Trust Layer where relevant (but don't be overly promotional)
- Focus on providing genuine value to readers
- Use proper markdown formatting with headers, bullet points, and emphasis
- Target length: 800-1200 words

DarkWave Context:
- DarkWave is a Layer 1 Proof-of-Authority blockchain (Trust Layer)
- Signal (SIG) is the native token - framed as "trust transmission" not cryptocurrency
- Key features: 400ms block times, 200K+ TPS, verified identity, enterprise-grade
- Focus is on business trust and accountability, not speculation`;

  const userPrompt = `Write a comprehensive blog post about: "${selectedTopic}"

Return a JSON object with these fields:
{
  "title": "SEO-optimized title (60 chars max)",
  "metaTitle": "Page title for SEO (60 chars max)",
  "metaDescription": "Compelling meta description (155 chars max)",
  "excerpt": "2-3 sentence summary for previews",
  "content": "Full article in markdown format",
  "keywords": ["array", "of", "5-8", "seo", "keywords"],
  "tags": ["array", "of", "3-5", "tags"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const slug = slugify(parsed.title || selectedTopic);
    const readTime = estimateReadTime(parsed.content || "");

    const [post] = await db.insert(blogPosts).values({
      slug,
      title: parsed.title || selectedTopic,
      excerpt: parsed.excerpt || "",
      content: parsed.content || "",
      metaTitle: parsed.metaTitle || parsed.title,
      metaDescription: parsed.metaDescription || parsed.excerpt,
      keywords: parsed.keywords || [],
      tags: parsed.tags || [],
      category: selectedCategory,
      readTimeMinutes: readTime,
      aiGenerated: true,
      aiPrompt: selectedTopic,
      status: "draft",
    }).returning();

    return post;
  } catch (error) {
    console.error("Blog generation error:", error);
    throw error;
  }
}

export async function getAllPosts(status?: string, limit = 20, offset = 0) {
  const conditions = status ? and(eq(blogPosts.status, status)) : undefined;
  
  const posts = await db.select({
    id: blogPosts.id,
    slug: blogPosts.slug,
    title: blogPosts.title,
    excerpt: blogPosts.excerpt,
    coverImage: blogPosts.coverImage,
    category: blogPosts.category,
    tags: blogPosts.tags,
    authorName: blogPosts.authorName,
    status: blogPosts.status,
    featured: blogPosts.featured,
    readTimeMinutes: blogPosts.readTimeMinutes,
    viewCount: blogPosts.viewCount,
    publishedAt: blogPosts.publishedAt,
    createdAt: blogPosts.createdAt,
  })
  .from(blogPosts)
  .where(conditions)
  .orderBy(desc(blogPosts.createdAt))
  .limit(limit)
  .offset(offset);

  return posts;
}

export async function getPostBySlug(slug: string, incrementViews = false) {
  const [post] = await db.select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (post && incrementViews && post.status === "published") {
    await db.update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, post.id));
  }

  return post;
}

export async function updatePost(id: string, updates: Partial<{
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  category: string;
  coverImage: string;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
}>) {
  const [post] = await db.update(blogPosts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();
  return post;
}

export async function publishPost(id: string) {
  return updatePost(id, { 
    status: "published", 
    publishedAt: new Date() 
  });
}

export async function deletePost(id: string) {
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return { success: true };
}

export async function getCategories() {
  return BLOG_TOPICS.map(c => ({
    id: c.category,
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    topics: c.topics
  }));
}

export async function getTopicSuggestions(category?: string) {
  if (category) {
    const cat = BLOG_TOPICS.find(c => c.category === category);
    return cat?.topics || [];
  }
  return BLOG_TOPICS.flatMap(c => c.topics);
}
