import React from "react";
import { SectionHeader, IntakeInput, IntakeCheckbox } from "./StepIntakeInfo";
import { YesNoToggle } from "./StepIntakeScopeContent";
import type { ProjectData } from "../types";
import type { IntakeFeatures, IntakeTechnical } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

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
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface StepIntakeFeaturesTechProps {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
}

export function StepIntakeFeaturesTech({ data, updateData }: StepIntakeFeaturesTechProps) {
  const features: IntakeFeatures = data.intake?.features ?? { selected: [] };
  const technical: IntakeTechnical = data.intake?.technical ?? {};

  const updateFeatures = (updates: Partial<IntakeFeatures>) => {
    updateData({
      intake: {
        ...data.intake,
        features: { ...features, ...updates },
      },
    });
  };

  const updateTechnical = (updates: Partial<IntakeTechnical>) => {
    updateData({
      intake: {
        ...data.intake,
        technical: { ...technical, ...updates },
      },
    });
  };

  const toggleFeature = (feature: string) => {
    const current = features.selected ?? [];
    const next = current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature];
    updateFeatures({ selected: next });
  };

  return (
    <div className="space-y-8">
      {/* Section 6: Features & Functionality */}
      <div>
        <SectionHeader number={6} title="Features & Functionality" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURE_OPTIONS.map((feature) => (
            <IntakeCheckbox
              key={feature}
              label={feature}
              checked={(features.selected ?? []).includes(feature)}
              onChange={() => toggleFeature(feature)}
            />
          ))}
        </div>
        {(features.selected ?? []).includes("Other") && (
          <div className="mt-3">
            <IntakeInput
              label="Other features (please specify)"
              value={features.other ?? ""}
              onChange={(v) => updateFeatures({ other: v })}
              placeholder="Describe additional features needed"
            />
          </div>
        )}
      </div>

      {/* Section 7: Technical Details */}
      <div>
        <SectionHeader number={7} title="Technical Details" />
        <div className="space-y-4">
          <YesNoToggle
            label="Has hosting?"
            value={technical.hasHosting}
            onChange={(v) => updateTechnical({ hasHosting: v })}
          />
          {technical.hasHosting && (
            <IntakeInput
              label="Hosting Provider"
              value={technical.hostingProvider ?? ""}
              onChange={(v) => updateTechnical({ hostingProvider: v })}
              placeholder="e.g., AWS, Vercel, Netlify"
            />
          )}
          <YesNoToggle
            label="Has domain?"
            value={technical.hasDomain}
            onChange={(v) => updateTechnical({ hasDomain: v })}
          />
          {technical.hasDomain && (
            <IntakeInput
              label="Domain Name"
              value={technical.domainName ?? ""}
              onChange={(v) => updateTechnical({ domainName: v })}
              placeholder="e.g., example.com"
            />
          )}
          <IntakeInput
            label="Existing Site URL to Migrate From"
            value={technical.existingSiteUrl ?? ""}
            onChange={(v) => updateTechnical({ existingSiteUrl: v })}
            placeholder="https://..."
          />
          <IntakeInput
            label="Preferred Platform / Tech"
            value={technical.preferredPlatform ?? ""}
            onChange={(v) => updateTechnical({ preferredPlatform: v })}
            placeholder="e.g., Next.js, WordPress, Shopify"
          />
        </div>
      </div>
    </div>
  );
}
