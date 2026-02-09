import type { ProjectIntake } from "@/lib/types"

/**
 * Computes intake brief completion as a percentage (0-100).
 * Counts how many "meaningful" fields have been filled across all 11 sections.
 */
export function computeIntakeProgress(intake?: ProjectIntake): number {
  if (!intake) return 0

  let filled = 0
  let total = 0

  // Helper: count a string field as filled if non-empty
  const str = (val?: string) => {
    total++
    if (val?.trim()) filled++
  }

  // Helper: count a boolean field (filled if explicitly set)
  const bool = (val?: boolean) => {
    total++
    if (val !== undefined) filled++
  }

  // Helper: count an array field as filled if non-empty
  const arr = (val?: string[]) => {
    total++
    if (val && val.length > 0) filled++
  }

  // Section 0: Project Info (6 fields)
  const info = intake.projectInfo
  str(info?.dateSold)
  str(info?.deadline)
  str(info?.salesContact)
  str(info?.clientContact)
  str(info?.clientEmail)
  str(info?.clientPhone)

  // Section 1: Project Types (1 field)
  arr(intake.projectTypes?.types)

  // Section 2: Scope & Structure (3 fields)
  const scope = intake.scopeStructure
  str(scope?.pageCount)
  str(scope?.pagesList)
  bool(scope?.hasSitemap)

  // Section 3: Content (2 fields)
  const content = intake.content
  str(content?.copyStatus)
  str(content?.ctaText)

  // Section 4: Branding & Assets (4 fields)
  const brand = intake.brandingAssets
  arr(brand?.mustHave)
  arr(brand?.niceToHave)
  arr(brand?.images)
  str(brand?.googleDriveLink)

  // Section 5: Inspiration (1 field — at least one URL filled)
  total++
  const hasInspirationRef = (intake.inspiration?.refs ?? []).some((r) => r.url?.trim())
  if (hasInspirationRef) filled++

  // Section 6: Features (1 field)
  arr(intake.features?.selected)

  // Section 7: Technical Details (4 fields)
  const tech = intake.technical
  bool(tech?.hasHosting)
  bool(tech?.hasDomain)
  str(tech?.existingSiteUrl)
  str(tech?.preferredPlatform)

  // Section 8: Access & Logins (1 field)
  arr(intake.accessLogins?.selected)

  // Section 9: Budget & Timeline (3 fields)
  const budget = intake.budgetTimeline
  str(budget?.totalPrice)
  str(budget?.paymentStructure)
  str(budget?.startDate)

  // Section 10: Extra Notes (1 field)
  str(intake.extraNotes)

  if (total === 0) return 0
  return Math.round((filled / total) * 100)
}
