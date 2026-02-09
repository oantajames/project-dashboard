export type ProjectStatus = "backlog" | "planned" | "active" | "on-hold" | "completed" | "cancelled"
export type ProjectPriority = "urgent" | "high" | "medium" | "low"

export interface ProjectScope {
  inScope: string[]
  outOfScope: string[]
}

export interface ProjectKeyFeatures {
  p0: string[] // Must have
  p1: string[] // Should have
  p2: string[] // Nice to have
}

// ─── Intake Questionnaire Types ───────────────────────────────────────────────

/** Section 0: Project Info */
export interface IntakeProjectInfo {
  dateSold?: string        // ISO date string
  deadline?: string        // ISO date string
  salesContact?: string
  clientContact?: string
  clientEmail?: string
  clientPhone?: string
}

/** Section 1: Project Type (multi-select checkboxes) */
export interface IntakeProjectTypes {
  types: string[]          // e.g. ["Landing Page", "Web App"]
  otherType?: string       // free-text when "Other" is checked
}

/** Section 2: Scope & Structure */
export interface IntakeScopeStructure {
  pageCount?: string
  pagesList?: string       // textarea: list of pages/sections
  hasSitemap?: boolean
  sitemapLink?: string     // shown when hasSitemap is true
}

/** Section 3: Content */
export type CopyStatus = "client" | "partial" | "we-write"

export interface IntakeContent {
  copyStatus?: CopyStatus
  copyMissing?: string     // shown when copyStatus is "partial"
  ctaText?: string
}

/** Section 4: Branding & Assets */
export interface IntakeBrandingAssets {
  mustHave: string[]       // Logo, Brand colors, Brand fonts
  niceToHave: string[]     // Brand guidelines PDF, Business card/letterhead, Social media profiles
  images: string[]         // Product photos, Team photos, Hero images/banners, Icons/illustrations
  googleDriveLink?: string
}

/** Section 5: Inspiration & References */
export interface InspirationRef {
  url: string
  notes: string
}

export interface IntakeInspiration {
  refs: InspirationRef[]
  stylesDislike?: string   // textarea: styles they do NOT like
}

/** Section 6: Features & Functionality (checkboxes) */
export interface IntakeFeatures {
  selected: string[]       // e.g. ["Contact form", "Blog", "SEO basics"]
  other?: string
}

/** Section 7: Technical Details */
export interface IntakeTechnical {
  hasHosting?: boolean
  hostingProvider?: string
  hasDomain?: boolean
  domainName?: string
  existingSiteUrl?: string
  preferredPlatform?: string
}

/** Section 8: Access & Logins */
export interface IntakeAccessLogins {
  selected: string[]       // Domain registrar, Hosting, CMS, Social media, Google Analytics
  other?: string
}

/** Section 9: Budget & Timeline */
export interface IntakeBudgetTimeline {
  totalPrice?: string
  paymentStructure?: string
  startDate?: string       // ISO date string
  expectedDelivery?: string
  hardDeadline?: string
}

/** Combined intake questionnaire — all 11 sections */
export interface ProjectIntake {
  projectInfo?: IntakeProjectInfo
  projectTypes?: IntakeProjectTypes
  scopeStructure?: IntakeScopeStructure
  content?: IntakeContent
  brandingAssets?: IntakeBrandingAssets
  inspiration?: IntakeInspiration
  features?: IntakeFeatures
  technical?: IntakeTechnical
  accessLogins?: IntakeAccessLogins
  budgetTimeline?: IntakeBudgetTimeline
  extraNotes?: string
}

// ─── Core Project Types ───────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  clientId: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate?: Date
  endDate?: Date
  progress: number // 0-100
  tags: string[]
  ownerId: string
  createdAt: Date
  updatedAt: Date

  // Team assignments
  picUserIds: string[] // Person(s) in charge
  supportUserIds: string[] // Support team members

  // Project metadata
  group?: string // e.g., "Design", "Development", "Marketing"
  typeLabel?: string // e.g., "MVP", "Revamp", "Audit"
  estimateHours?: number // Time estimate in hours
  location?: string // e.g., "Remote", "Australia"

  // Overview content
  scope?: ProjectScope
  outcomes?: string[]
  keyFeatures?: ProjectKeyFeatures

  // Intake questionnaire data
  intake?: ProjectIntake
}

export interface CreateProjectData {
  name: string
  clientId: string
  description?: string
  status?: ProjectStatus
  priority?: ProjectPriority
  startDate?: Date
  endDate?: Date
  tags?: string[]

  // Team assignments
  picUserIds?: string[]
  supportUserIds?: string[]

  // Project metadata
  group?: string
  typeLabel?: string
  estimateHours?: number
  location?: string

  // Overview content
  scope?: ProjectScope
  outcomes?: string[]
  keyFeatures?: ProjectKeyFeatures

  // Intake questionnaire data
  intake?: ProjectIntake
}
