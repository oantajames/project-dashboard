import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader, IntakeInput, IntakeCheckbox } from "./StepIntakeInfo";
import type { ProjectData } from "../types";
import type { IntakeScopeStructure, IntakeContent, CopyStatus } from "@/lib/types";

// ─── Pill Radio Button ────────────────────────────────────────────────────────

function PillRadio({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
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
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex gap-1">
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
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

function IntakeTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
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
  );
}

// ─── Copy Status Options ──────────────────────────────────────────────────────

const COPY_OPTIONS: { id: CopyStatus; label: string }[] = [
  { id: "client", label: "Client provides all" },
  { id: "partial", label: "Partial" },
  { id: "we-write", label: "We write it" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface StepIntakeScopeContentProps {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
}

export function StepIntakeScopeContent({ data, updateData }: StepIntakeScopeContentProps) {
  const scope: IntakeScopeStructure = data.intake?.scopeStructure ?? {};
  const content: IntakeContent = data.intake?.content ?? {};

  const updateScope = (updates: Partial<IntakeScopeStructure>) => {
    updateData({
      intake: {
        ...data.intake,
        scopeStructure: { ...scope, ...updates },
      },
    });
  };

  const updateContent = (updates: Partial<IntakeContent>) => {
    updateData({
      intake: {
        ...data.intake,
        content: { ...content, ...updates },
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Section 2: Scope & Structure */}
      <div>
        <SectionHeader number={2} title="Scope & Structure" />
        <div className="space-y-4">
          <IntakeInput
            label="How many pages/screens?"
            value={scope.pageCount ?? ""}
            onChange={(v) => updateScope({ pageCount: v })}
            placeholder="e.g., 8 pages"
          />
          <IntakeTextarea
            label="List pages/sections needed"
            value={scope.pagesList ?? ""}
            onChange={(v) => updateScope({ pagesList: v })}
            placeholder="Home, About, Services, Contact, Blog..."
            rows={3}
          />
          <YesNoToggle
            label="Does client have an information architecture / sitemap?"
            value={scope.hasSitemap}
            onChange={(v) => updateScope({ hasSitemap: v })}
          />
          {scope.hasSitemap && (
            <IntakeInput
              label="Sitemap / IA Link"
              value={scope.sitemapLink ?? ""}
              onChange={(v) => updateScope({ sitemapLink: v })}
              placeholder="https://..."
            />
          )}
        </div>
      </div>

      {/* Section 3: Content */}
      <div>
        <SectionHeader number={3} title="Content" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Copy / content status</label>
            <PillRadio options={COPY_OPTIONS} value={content.copyStatus} onChange={(v) => updateContent({ copyStatus: v as CopyStatus })} />
          </div>
          {content.copyStatus === "partial" && (
            <IntakeTextarea
              label="What copy is missing?"
              value={content.copyMissing ?? ""}
              onChange={(v) => updateContent({ copyMissing: v })}
              placeholder="Describe what content still needs to be provided..."
            />
          )}
          <IntakeInput
            label="Call to Action / CTA"
            value={content.ctaText ?? ""}
            onChange={(v) => updateContent({ ctaText: v })}
            placeholder='e.g., "Get Started", "Book a Demo"'
          />
        </div>
      </div>
    </div>
  );
}

// Re-export reusable components for other steps
export { PillRadio, YesNoToggle, IntakeTextarea };
