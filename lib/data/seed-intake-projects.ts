import type { CreateProjectData, ProjectIntake } from "@/lib/types"

/**
 * Two demo project seeds with filled intake questionnaire data.
 * Use these to populate the dashboard so it doesn't look empty on first load.
 *
 * Usage:
 *   import { SEED_PROJECTS } from "@/lib/data/seed-intake-projects"
 *   for (const seed of SEED_PROJECTS) {
 *     await createProject(seed, ownerId)
 *   }
 */

// ─── Seed 1: Acme Corp Website Redesign ──────────────────────────────────────

const acmeIntake: ProjectIntake = {
  projectInfo: {
    dateSold: "2026-01-15T00:00:00.000Z",
    deadline: "2026-04-30T00:00:00.000Z",
    salesContact: "Emily Carter",
    clientContact: "John Doe",
    clientEmail: "john@acmecorp.com",
    clientPhone: "+1 (415) 555-0123",
  },
  projectTypes: {
    types: ["Multi-page Website", "Redesign/Revamp"],
  },
  scopeStructure: {
    pageCount: "12",
    pagesList: "Home, About Us, Services (3 sub-pages), Portfolio, Case Studies, Team, Blog, Contact, Careers, FAQ",
    hasSitemap: true,
    sitemapLink: "https://drive.google.com/file/d/acme-sitemap",
  },
  content: {
    copyStatus: "partial",
    copyMissing: "Case studies copy and team bios still pending from client.",
    ctaText: "Get a Free Quote",
  },
  brandingAssets: {
    mustHave: ["Logo", "Brand colors (hex/Pantone)", "Brand fonts"],
    niceToHave: ["Brand guidelines PDF", "Social media profiles"],
    images: ["Product photos", "Team photos", "Hero images/banners"],
    googleDriveLink: "https://drive.google.com/drive/folders/acme-assets",
  },
  inspiration: {
    refs: [
      { url: "https://stripe.com", notes: "Clean layout, great use of whitespace" },
      { url: "https://linear.app", notes: "Modern feel, smooth animations" },
      { url: "https://vercel.com", notes: "Dark/light mode toggle, developer-friendly" },
    ],
    stylesDislike: "Heavy gradients, overly decorative borders, clip-art style illustrations.",
  },
  features: {
    selected: ["Contact form", "Blog", "Analytics", "SEO basics", "Newsletter signup", "Social media links"],
  },
  technical: {
    hasHosting: true,
    hostingProvider: "Vercel",
    hasDomain: true,
    domainName: "acmecorp.com",
    existingSiteUrl: "https://old.acmecorp.com",
    preferredPlatform: "Next.js",
  },
  accessLogins: {
    selected: ["Domain registrar", "Hosting", "Google Analytics"],
  },
  budgetTimeline: {
    totalPrice: "$18,000",
    paymentStructure: "40% upfront, 30% at design approval, 30% on launch",
    startDate: "2026-02-01T00:00:00.000Z",
    expectedDelivery: "2026-04-15T00:00:00.000Z",
    hardDeadline: "2026-04-30T00:00:00.000Z",
  },
  extraNotes: "Client is migrating from WordPress. They want to keep existing blog posts (roughly 45 articles). SEO rankings must be preserved via 301 redirects.",
}

const acmeSeed: CreateProjectData = {
  name: "Acme Corp Website Redesign",
  clientId: "", // Set to actual clientId during seeding
  description: "Complete redesign of Acme Corp's corporate website, migrating from WordPress to Next.js with modern UI.",
  status: "active",
  priority: "high",
  startDate: new Date("2026-02-01"),
  endDate: new Date("2026-04-30"),
  tags: ["Multi-page Website", "Redesign/Revamp"],
  typeLabel: "Multi-page Website, Redesign/Revamp",
  group: "Design",
  intake: acmeIntake,
}

// ─── Seed 2: FreshBites Mobile App ───────────────────────────────────────────

const freshBitesIntake: ProjectIntake = {
  projectInfo: {
    dateSold: "2026-01-28T00:00:00.000Z",
    deadline: "2026-06-30T00:00:00.000Z",
    salesContact: "Marcus Lee",
    clientContact: "Sarah Chen",
    clientEmail: "sarah@freshbites.io",
    clientPhone: "+1 (212) 555-0456",
  },
  projectTypes: {
    types: ["Mobile App", "Web App"],
  },
  scopeStructure: {
    pageCount: "18 screens",
    pagesList: "Onboarding (3), Home/Feed, Search, Restaurant Detail, Menu, Cart, Checkout, Order Tracking, Profile, Order History, Settings, Notifications, Favorites, Reviews, Help/Support",
    hasSitemap: false,
  },
  content: {
    copyStatus: "we-write",
    ctaText: "Order Now",
  },
  brandingAssets: {
    mustHave: ["Logo", "Brand colors (hex/Pantone)"],
    niceToHave: ["Brand guidelines PDF"],
    images: ["Product photos", "Icons/illustrations"],
    googleDriveLink: "https://drive.google.com/drive/folders/freshbites-brand",
  },
  inspiration: {
    refs: [
      { url: "https://uber.com/eats", notes: "Smooth ordering flow, live tracking" },
      { url: "https://doordash.com", notes: "Restaurant cards and search UX" },
    ],
    stylesDislike: "Nothing too corporate. Needs to feel fresh and approachable, not enterprise.",
  },
  features: {
    selected: ["E-commerce", "Login/accounts", "Chat widget", "Analytics", "SEO basics"],
    other: "Push notifications, real-time order tracking, payment gateway integration (Stripe)",
  },
  technical: {
    hasHosting: false,
    hasDomain: true,
    domainName: "freshbites.io",
    preferredPlatform: "React Native + Next.js API",
  },
  accessLogins: {
    selected: ["Domain registrar", "Social media", "Google Analytics"],
  },
  budgetTimeline: {
    totalPrice: "$45,000",
    paymentStructure: "30% upfront, 40% at beta, 30% on launch",
    startDate: "2026-02-15T00:00:00.000Z",
    expectedDelivery: "2026-06-01T00:00:00.000Z",
    hardDeadline: "2026-06-30T00:00:00.000Z",
  },
  extraNotes: "MVP for iOS first, Android to follow in Phase 2. Need Stripe integration for payments. Client wants to soft launch in NYC area only.",
}

const freshBitesSeed: CreateProjectData = {
  name: "FreshBites Mobile App",
  clientId: "", // Set to actual clientId during seeding
  description: "Food delivery mobile app MVP (iOS first), with restaurant discovery, ordering, and real-time tracking.",
  status: "planned",
  priority: "urgent",
  startDate: new Date("2026-02-15"),
  endDate: new Date("2026-06-30"),
  tags: ["Mobile App", "Web App"],
  typeLabel: "Mobile App, Web App",
  group: "Development",
  intake: freshBitesIntake,
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const SEED_PROJECTS: CreateProjectData[] = [acmeSeed, freshBitesSeed]
