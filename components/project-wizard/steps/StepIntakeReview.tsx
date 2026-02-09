import React from "react";
import { cn } from "@/lib/utils";
import {
  Info,
  Browser,
  TreeStructure,
  TextAa,
  Palette,
  Sparkle,
  Gear,
  Desktop,
  Key,
  CurrencyDollar,
  NoteBlank,
  Check,
  PencilSimpleLine,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "../../ui/button";
import type { ProjectData } from "../types";
import type { ProjectIntake } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepIntakeReviewProps {
  data: ProjectData;
  onEditStep?: (step: number) => void;
}

// ─── Section summary ──────────────────────────────────────────────────────────

interface SectionSummaryProps {
  number: number;
  title: string;
  icon: React.ReactNode;
  items: string[];
  editStep: number;
  onEdit: (step: number) => void;
}

function SectionSummary({ number, title, icon, items, editStep, onEdit }: SectionSummaryProps) {
  const hasContent = items.some((i) => i && i !== "Not specified");

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex items-center justify-center size-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
            {number}
          </span>
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        <div className="space-y-0.5">
          {items.map((item, i) => (
            <p key={i} className="text-xs text-muted-foreground truncate">
              {item || "Not specified"}
            </p>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full shrink-0"
        type="button"
        onClick={() => onEdit(editStep)}
      >
        <PencilSimpleLine className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StepIntakeReview({ data, onEditStep }: StepIntakeReviewProps) {
  const intake = data.intake ?? {};
  const handleEdit = (step: number) => onEditStep?.(step);

  // Summarize each section
  const projectInfoSummary = [
    intake.projectInfo?.salesContact ? `Sales: ${intake.projectInfo.salesContact}` : "",
    intake.projectInfo?.clientContact ? `Client: ${intake.projectInfo.clientContact}` : "",
    intake.projectInfo?.dateSold ? `Sold: ${new Date(intake.projectInfo.dateSold).toLocaleDateString()}` : "",
  ].filter(Boolean);
  if (projectInfoSummary.length === 0) projectInfoSummary.push("Not specified");

  const typesSummary = (intake.projectTypes?.types ?? []).length > 0
    ? [intake.projectTypes!.types.join(", ")]
    : ["Not specified"];

  const scopeSummary = [
    intake.scopeStructure?.pageCount ? `${intake.scopeStructure.pageCount} pages` : "",
    intake.scopeStructure?.hasSitemap ? "Has sitemap" : "",
  ].filter(Boolean);
  if (scopeSummary.length === 0) scopeSummary.push("Not specified");

  const contentSummary = [
    intake.content?.copyStatus ? `Copy: ${intake.content.copyStatus}` : "",
    intake.content?.ctaText ? `CTA: ${intake.content.ctaText}` : "",
  ].filter(Boolean);
  if (contentSummary.length === 0) contentSummary.push("Not specified");

  const brandingSummary = [
    ...(intake.brandingAssets?.mustHave ?? []).map((i) => `Must: ${i}`),
    ...(intake.brandingAssets?.niceToHave ?? []).map((i) => `Nice: ${i}`),
  ].slice(0, 3);
  if (brandingSummary.length === 0) brandingSummary.push("Not specified");

  const inspirationCount = (intake.inspiration?.refs ?? []).filter((r) => r.url).length;
  const inspirationSummary = inspirationCount > 0
    ? [`${inspirationCount} reference${inspirationCount > 1 ? "s" : ""}`]
    : ["Not specified"];

  const featuresSummary = (intake.features?.selected ?? []).length > 0
    ? [intake.features!.selected.slice(0, 4).join(", ") + ((intake.features!.selected.length > 4) ? "..." : "")]
    : ["Not specified"];

  const techSummary = [
    intake.technical?.hasHosting ? `Hosting: ${intake.technical.hostingProvider || "Yes"}` : "",
    intake.technical?.hasDomain ? `Domain: ${intake.technical.domainName || "Yes"}` : "",
    intake.technical?.preferredPlatform ? `Platform: ${intake.technical.preferredPlatform}` : "",
  ].filter(Boolean);
  if (techSummary.length === 0) techSummary.push("Not specified");

  const accessSummary = (intake.accessLogins?.selected ?? []).length > 0
    ? [intake.accessLogins!.selected.join(", ")]
    : ["Not specified"];

  const budgetSummary = [
    intake.budgetTimeline?.totalPrice ? `Price: ${intake.budgetTimeline.totalPrice}` : "",
    intake.budgetTimeline?.paymentStructure ? `Payment: ${intake.budgetTimeline.paymentStructure}` : "",
  ].filter(Boolean);
  if (budgetSummary.length === 0) budgetSummary.push("Not specified");

  return (
    <div className="flex flex-col space-y-4 bg-muted p-4 rounded-2xl">
      <div className="mb-2">
        <p className="text-sm font-semibold text-foreground">
          {data.intakeProjectName || "Untitled Project"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Review your project brief below.</p>
      </div>

      <div className="space-y-1">
        <SectionSummary number={0} title="Project Info" icon={<Info className="h-5 w-5" />} items={projectInfoSummary} editStep={1} onEdit={handleEdit} />
        <SectionSummary number={1} title="Project Type" icon={<Browser className="h-5 w-5" />} items={typesSummary} editStep={1} onEdit={handleEdit} />
        <SectionSummary number={2} title="Scope & Structure" icon={<TreeStructure className="h-5 w-5" />} items={scopeSummary} editStep={2} onEdit={handleEdit} />
        <SectionSummary number={3} title="Content" icon={<TextAa className="h-5 w-5" />} items={contentSummary} editStep={2} onEdit={handleEdit} />
        <SectionSummary number={4} title="Branding & Assets" icon={<Palette className="h-5 w-5" />} items={brandingSummary} editStep={3} onEdit={handleEdit} />
        <SectionSummary number={5} title="Inspiration" icon={<Sparkle className="h-5 w-5" />} items={inspirationSummary} editStep={3} onEdit={handleEdit} />
        <SectionSummary number={6} title="Features" icon={<Gear className="h-5 w-5" />} items={featuresSummary} editStep={4} onEdit={handleEdit} />
        <SectionSummary number={7} title="Technical" icon={<Desktop className="h-5 w-5" />} items={techSummary} editStep={4} onEdit={handleEdit} />
        <SectionSummary number={8} title="Access & Logins" icon={<Key className="h-5 w-5" />} items={accessSummary} editStep={5} onEdit={handleEdit} />
        <SectionSummary number={9} title="Budget & Timeline" icon={<CurrencyDollar className="h-5 w-5" />} items={budgetSummary} editStep={5} onEdit={handleEdit} />
        {intake.extraNotes && (
          <SectionSummary number={10} title="Extra Notes" icon={<NoteBlank className="h-5 w-5" />} items={[intake.extraNotes.slice(0, 80) + (intake.extraNotes.length > 80 ? "..." : "")]} editStep={5} onEdit={handleEdit} />
        )}
      </div>
    </div>
  );
}
