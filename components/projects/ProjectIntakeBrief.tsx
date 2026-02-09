"use client"

import React, { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Check,
  Plus,
  Trash,
  CalendarBlank,
  FloppyDisk,
} from "@phosphor-icons/react/dist/ssr"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { updateProject } from "@/lib/firebase/services/projects"
import type {
  Project,
  ProjectIntake,
  IntakeProjectInfo,
  IntakeProjectTypes,
  IntakeScopeStructure,
  IntakeContent,
  CopyStatus,
  IntakeBrandingAssets,
  IntakeInspiration,
  InspirationRef,
  IntakeFeatures,
  IntakeTechnical,
  IntakeAccessLogins,
  IntakeBudgetTimeline,
} from "@/lib/types"
import { computeIntakeProgress } from "@/lib/utils/intake-progress"

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_TYPE_OPTIONS = [
  "Landing Page",
  "Multi-page Website",
  "Mobile App",
  "Web App",
  "Redesign/Revamp",
  "Other",
]

const MUST_HAVE_OPTIONS = ["Logo", "Brand colors (hex/Pantone)", "Brand fonts"]
const NICE_TO_HAVE_OPTIONS = ["Brand guidelines PDF", "Business card/letterhead", "Social media profiles"]
const IMAGE_OPTIONS = ["Product photos", "Team photos", "Hero images/banners", "Icons/illustrations"]

const FEATURE_OPTIONS = [
  "Contact form",
  "Newsletter signup",
  "E-commerce",
  "Blog",
  "Booking/calendar",
  "Chat widget",
  "Social media links",
  "Analytics",
  "SEO basics",
  "Multi-language",
  "Login/accounts",
  "Other",
]

const ACCESS_OPTIONS = [
  "Domain registrar",
  "Hosting",
  "CMS",
  "Social media",
  "Google Analytics",
  "Other",
]

const COPY_OPTIONS: { id: CopyStatus; label: string }[] = [
  { id: "client", label: "Client provides all" },
  { id: "partial", label: "Partial" },
  { id: "we-write", label: "We write it" },
]

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

/** Numbered section header with blue circle */
function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 mb-5 border-b border-border">
      <div className="flex items-center justify-center size-7 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  )
}

/** Intake-styled text input */
function IntakeInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
      />
    </div>
  )
}

/** Intake-styled textarea */
function IntakeTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors resize-y"
      />
    </div>
  )
}

/** Custom styled checkbox: blue fill + line-through label */
function IntakeCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 group cursor-pointer"
    >
      <div
        className={cn(
          "flex items-center justify-center size-5 rounded border transition-all",
          checked
            ? "bg-blue-600 border-blue-600"
            : "bg-white dark:bg-muted border-border hover:border-blue-400"
        )}
      >
        {checked && <Check className="size-3 text-white" weight="bold" />}
      </div>
      <span
        className={cn(
          "text-sm transition-all",
          checked ? "line-through text-muted-foreground" : "text-foreground"
        )}
      >
        {label}
      </span>
    </button>
  )
}

/** Pill-style radio group */
function PillRadio({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer",
            value === opt.id
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-50 dark:bg-muted text-foreground border-border hover:border-blue-400"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** Yes/No toggle */
function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "px-3 py-1 rounded-l-full text-xs font-medium border transition-all cursor-pointer",
            value === true
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-50 dark:bg-muted text-muted-foreground border-border"
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "px-3 py-1 rounded-r-full text-xs font-medium border transition-all cursor-pointer",
            value === false
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-50 dark:bg-muted text-muted-foreground border-border"
          )}
        >
          No
        </button>
      </div>
    </div>
  )
}

/** Date picker */
function IntakeDatePicker({
  label,
  date,
  onSelect,
}: {
  label: string
  date?: string
  onSelect: (date: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const parsedDate = date ? new Date(date) : undefined

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-2 rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-left hover:border-blue-400 transition-colors">
            <CalendarBlank className="size-4 text-muted-foreground" />
            <span className={parsedDate ? "text-foreground" : "text-muted-foreground"}>
              {parsedDate ? format(parsedDate, "MMM d, yyyy") : "Select date"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={(d) => {
              onSelect(d ? d.toISOString() : undefined)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function IntakeProgressBar({ intake }: { intake?: ProjectIntake }) {
  const percent = computeIntakeProgress(intake)

  const barColor =
    percent >= 75 ? "bg-green-500" : percent >= 40 ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Brief completion</span>
        <span className="font-medium">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProjectIntakeBriefProps {
  project: Project
}

export function ProjectIntakeBrief({ project }: ProjectIntakeBriefProps) {
  const [intake, setIntake] = useState<ProjectIntake>(project.intake ?? {})
  const [isSaving, setIsSaving] = useState(false)

  // Helpers to update nested sections
  const updateSection = useCallback(
    <K extends keyof ProjectIntake>(key: K, value: ProjectIntake[K]) => {
      setIntake((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const info: IntakeProjectInfo = intake.projectInfo ?? {}
  const types: IntakeProjectTypes = intake.projectTypes ?? { types: [] }
  const scope: IntakeScopeStructure = intake.scopeStructure ?? {}
  const content: IntakeContent = intake.content ?? {}
  const branding: IntakeBrandingAssets = intake.brandingAssets ?? { mustHave: [], niceToHave: [], images: [] }
  const inspiration: IntakeInspiration = intake.inspiration ?? { refs: [{ url: "", notes: "" }, { url: "", notes: "" }, { url: "", notes: "" }] }
  const features: IntakeFeatures = intake.features ?? { selected: [] }
  const technical: IntakeTechnical = intake.technical ?? {}
  const access: IntakeAccessLogins = intake.accessLogins ?? { selected: [] }
  const budget: IntakeBudgetTimeline = intake.budgetTimeline ?? {}

  // Toggle helpers
  const toggleInArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]

  // Save handler
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProject(project.id, { intake })
      toast.success("Brief saved")
    } catch (err) {
      console.error("Error saving brief:", err)
      toast.error("Failed to save brief")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Progress bar at top */}
      <IntakeProgressBar intake={intake} />

      {/* Section 0: Project Info */}
      <section>
        <SectionHeader number={0} title="Project Info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IntakeDatePicker label="Date Sold" date={info.dateSold} onSelect={(d) => updateSection("projectInfo", { ...info, dateSold: d })} />
          <IntakeDatePicker label="Deadline" date={info.deadline} onSelect={(d) => updateSection("projectInfo", { ...info, deadline: d })} />
          <IntakeInput label="Sales Contact" value={info.salesContact ?? ""} onChange={(v) => updateSection("projectInfo", { ...info, salesContact: v })} placeholder="Name" />
          <IntakeInput label="Client Contact" value={info.clientContact ?? ""} onChange={(v) => updateSection("projectInfo", { ...info, clientContact: v })} placeholder="Name" />
          <IntakeInput label="Client Email" value={info.clientEmail ?? ""} onChange={(v) => updateSection("projectInfo", { ...info, clientEmail: v })} placeholder="email@example.com" type="email" />
          <IntakeInput label="Client Phone" value={info.clientPhone ?? ""} onChange={(v) => updateSection("projectInfo", { ...info, clientPhone: v })} placeholder="+1 (555) 000-0000" type="tel" />
        </div>
      </section>

      {/* Section 1: Project Type */}
      <section>
        <SectionHeader number={1} title="Project Type" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROJECT_TYPE_OPTIONS.map((type) => (
            <IntakeCheckbox
              key={type}
              label={type}
              checked={(types.types ?? []).includes(type)}
              onChange={() => updateSection("projectTypes", { ...types, types: toggleInArray(types.types ?? [], type) })}
            />
          ))}
        </div>
        {(types.types ?? []).includes("Other") && (
          <div className="mt-3">
            <IntakeInput
              label="Other (specify)"
              value={types.otherType ?? ""}
              onChange={(v) => updateSection("projectTypes", { ...types, otherType: v })}
              placeholder="Describe the project type"
            />
          </div>
        )}
      </section>

      {/* Section 2: Scope & Structure */}
      <section>
        <SectionHeader number={2} title="Scope & Structure" />
        <div className="space-y-4">
          <IntakeInput label="How many pages/screens?" value={scope.pageCount ?? ""} onChange={(v) => updateSection("scopeStructure", { ...scope, pageCount: v })} placeholder="e.g., 8 pages" />
          <IntakeTextarea label="List pages/sections needed" value={scope.pagesList ?? ""} onChange={(v) => updateSection("scopeStructure", { ...scope, pagesList: v })} placeholder="Home, About, Services, Contact, Blog..." rows={3} />
          <YesNoToggle label="Does client have a sitemap / IA?" value={scope.hasSitemap} onChange={(v) => updateSection("scopeStructure", { ...scope, hasSitemap: v })} />
          {scope.hasSitemap && (
            <IntakeInput label="Sitemap / IA Link" value={scope.sitemapLink ?? ""} onChange={(v) => updateSection("scopeStructure", { ...scope, sitemapLink: v })} placeholder="https://..." />
          )}
        </div>
      </section>

      {/* Section 3: Content */}
      <section>
        <SectionHeader number={3} title="Content" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Copy / content status</label>
            <PillRadio options={COPY_OPTIONS} value={content.copyStatus} onChange={(v) => updateSection("content", { ...content, copyStatus: v as CopyStatus })} />
          </div>
          {content.copyStatus === "partial" && (
            <IntakeTextarea label="What copy is missing?" value={content.copyMissing ?? ""} onChange={(v) => updateSection("content", { ...content, copyMissing: v })} placeholder="Describe what content still needs to be provided..." />
          )}
          <IntakeInput label="Call to Action / CTA" value={content.ctaText ?? ""} onChange={(v) => updateSection("content", { ...content, ctaText: v })} placeholder='"Get Started", "Book a Demo"' />
        </div>
      </section>

      {/* Section 4: Branding & Assets */}
      <section>
        <SectionHeader number={4} title="Branding & Assets" />
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Must Have</p>
            <div className="space-y-2">
              {MUST_HAVE_OPTIONS.map((item) => (
                <IntakeCheckbox key={item} label={item} checked={(branding.mustHave ?? []).includes(item)} onChange={() => updateSection("brandingAssets", { ...branding, mustHave: toggleInArray(branding.mustHave ?? [], item) })} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Nice to Have</p>
            <div className="space-y-2">
              {NICE_TO_HAVE_OPTIONS.map((item) => (
                <IntakeCheckbox key={item} label={item} checked={(branding.niceToHave ?? []).includes(item)} onChange={() => updateSection("brandingAssets", { ...branding, niceToHave: toggleInArray(branding.niceToHave ?? [], item) })} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Images</p>
            <div className="space-y-2">
              {IMAGE_OPTIONS.map((item) => (
                <IntakeCheckbox key={item} label={item} checked={(branding.images ?? []).includes(item)} onChange={() => updateSection("brandingAssets", { ...branding, images: toggleInArray(branding.images ?? [], item) })} />
              ))}
            </div>
          </div>
          <IntakeInput label="Google Drive Folder Link" value={branding.googleDriveLink ?? ""} onChange={(v) => updateSection("brandingAssets", { ...branding, googleDriveLink: v })} placeholder="https://drive.google.com/..." />
        </div>
      </section>

      {/* Section 5: Inspiration & References */}
      <section>
        <SectionHeader number={5} title="Inspiration & References" />
        <div className="space-y-4">
          <div className="space-y-3">
            {(inspiration.refs ?? []).map((ref, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={ref.url}
                    onChange={(e) => {
                      const refs = [...(inspiration.refs ?? [])]
                      refs[index] = { ...refs[index], url: e.target.value }
                      updateSection("inspiration", { ...inspiration, refs })
                    }}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                  <input
                    type="text"
                    value={ref.notes}
                    onChange={(e) => {
                      const refs = [...(inspiration.refs ?? [])]
                      refs[index] = { ...refs[index], notes: e.target.value }
                      updateSection("inspiration", { ...inspiration, refs })
                    }}
                    placeholder="What do they like about it?"
                    className="w-full rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>
                {(inspiration.refs ?? []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const refs = (inspiration.refs ?? []).filter((_, i) => i !== index)
                      updateSection("inspiration", { ...inspiration, refs })
                    }}
                    className="mt-2 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => updateSection("inspiration", { ...inspiration, refs: [...(inspiration.refs ?? []), { url: "", notes: "" }] })}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            <Plus className="size-4" />
            Add another
          </button>
          <IntakeTextarea label="Styles they do NOT like" value={inspiration.stylesDislike ?? ""} onChange={(v) => updateSection("inspiration", { ...inspiration, stylesDislike: v })} placeholder="Describe design styles or patterns to avoid..." />
        </div>
      </section>

      {/* Section 6: Features & Functionality */}
      <section>
        <SectionHeader number={6} title="Features & Functionality" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURE_OPTIONS.map((feature) => (
            <IntakeCheckbox key={feature} label={feature} checked={(features.selected ?? []).includes(feature)} onChange={() => updateSection("features", { ...features, selected: toggleInArray(features.selected ?? [], feature) })} />
          ))}
        </div>
        {(features.selected ?? []).includes("Other") && (
          <div className="mt-3">
            <IntakeInput label="Other features" value={features.other ?? ""} onChange={(v) => updateSection("features", { ...features, other: v })} placeholder="Describe additional features" />
          </div>
        )}
      </section>

      {/* Section 7: Technical Details */}
      <section>
        <SectionHeader number={7} title="Technical Details" />
        <div className="space-y-4">
          <YesNoToggle label="Has hosting?" value={technical.hasHosting} onChange={(v) => updateSection("technical", { ...technical, hasHosting: v })} />
          {technical.hasHosting && (
            <IntakeInput label="Hosting Provider" value={technical.hostingProvider ?? ""} onChange={(v) => updateSection("technical", { ...technical, hostingProvider: v })} placeholder="e.g., AWS, Vercel" />
          )}
          <YesNoToggle label="Has domain?" value={technical.hasDomain} onChange={(v) => updateSection("technical", { ...technical, hasDomain: v })} />
          {technical.hasDomain && (
            <IntakeInput label="Domain Name" value={technical.domainName ?? ""} onChange={(v) => updateSection("technical", { ...technical, domainName: v })} placeholder="example.com" />
          )}
          <IntakeInput label="Existing Site URL" value={technical.existingSiteUrl ?? ""} onChange={(v) => updateSection("technical", { ...technical, existingSiteUrl: v })} placeholder="https://..." />
          <IntakeInput label="Preferred Platform / Tech" value={technical.preferredPlatform ?? ""} onChange={(v) => updateSection("technical", { ...technical, preferredPlatform: v })} placeholder="e.g., Next.js, WordPress" />
        </div>
      </section>

      {/* Section 8: Access & Logins */}
      <section>
        <SectionHeader number={8} title="Access & Logins" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACCESS_OPTIONS.map((item) => (
              <IntakeCheckbox key={item} label={item} checked={(access.selected ?? []).includes(item)} onChange={() => updateSection("accessLogins", { ...access, selected: toggleInArray(access.selected ?? [], item) })} />
            ))}
          </div>
          {(access.selected ?? []).includes("Other") && (
            <IntakeInput label="Other access" value={access.other ?? ""} onChange={(v) => updateSection("accessLogins", { ...access, other: v })} placeholder="Describe other access needed" />
          )}
          <p className="text-xs text-muted-foreground italic">Note: Share credentials securely, not in this form.</p>
        </div>
      </section>

      {/* Section 9: Budget & Timeline */}
      <section>
        <SectionHeader number={9} title="Budget & Timeline" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IntakeInput label="Total Price" value={budget.totalPrice ?? ""} onChange={(v) => updateSection("budgetTimeline", { ...budget, totalPrice: v })} placeholder="e.g., $5,000" />
          <IntakeInput label="Payment Structure" value={budget.paymentStructure ?? ""} onChange={(v) => updateSection("budgetTimeline", { ...budget, paymentStructure: v })} placeholder="e.g., 50% upfront, 50% on delivery" />
          <IntakeDatePicker label="Start Date" date={budget.startDate} onSelect={(d) => updateSection("budgetTimeline", { ...budget, startDate: d })} />
          <IntakeDatePicker label="Expected Delivery" date={budget.expectedDelivery} onSelect={(d) => updateSection("budgetTimeline", { ...budget, expectedDelivery: d })} />
          <IntakeDatePicker label="Hard Deadline" date={budget.hardDeadline} onSelect={(d) => updateSection("budgetTimeline", { ...budget, hardDeadline: d })} />
        </div>
      </section>

      {/* Section 10: Extra Notes */}
      <section>
        <SectionHeader number={10} title="Extra Notes" />
        <IntakeTextarea
          label="Anything else?"
          value={intake.extraNotes ?? ""}
          onChange={(v) => updateSection("extraNotes", v)}
          placeholder="Add any other notes, requirements, or context..."
          rows={5}
        />
      </section>

      {/* Save Button (sticky at bottom) */}
      <div className="sticky bottom-0 pt-4 pb-2 bg-background border-t border-border -mx-4 px-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          <FloppyDisk className="size-4 mr-2" />
          {isSaving ? "Saving..." : "Save Brief"}
        </Button>
      </div>
    </div>
  )
}
