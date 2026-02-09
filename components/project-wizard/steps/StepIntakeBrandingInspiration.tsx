import React from "react";
import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { SectionHeader, IntakeInput, IntakeCheckbox } from "./StepIntakeInfo";
import { IntakeTextarea } from "./StepIntakeScopeContent";
import type { ProjectData } from "../types";
import type { IntakeBrandingAssets, IntakeInspiration, InspirationRef } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MUST_HAVE_OPTIONS = ["Logo", "Brand colors (hex/Pantone)", "Brand fonts"];
const NICE_TO_HAVE_OPTIONS = ["Brand guidelines PDF", "Business card/letterhead", "Social media profiles"];
const IMAGE_OPTIONS = ["Product photos", "Team photos", "Hero images/banners", "Icons/illustrations"];

// ─── Main Component ───────────────────────────────────────────────────────────

interface StepIntakeBrandingInspirationProps {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
}

export function StepIntakeBrandingInspiration({ data, updateData }: StepIntakeBrandingInspirationProps) {
  const branding: IntakeBrandingAssets = data.intake?.brandingAssets ?? {
    mustHave: [],
    niceToHave: [],
    images: [],
  };
  const inspiration: IntakeInspiration = data.intake?.inspiration ?? {
    refs: [
      { url: "", notes: "" },
      { url: "", notes: "" },
      { url: "", notes: "" },
    ],
  };

  const updateBranding = (updates: Partial<IntakeBrandingAssets>) => {
    updateData({
      intake: {
        ...data.intake,
        brandingAssets: { ...branding, ...updates },
      },
    });
  };

  const updateInspiration = (updates: Partial<IntakeInspiration>) => {
    updateData({
      intake: {
        ...data.intake,
        inspiration: { ...inspiration, ...updates },
      },
    });
  };

  const toggleBrandingItem = (group: "mustHave" | "niceToHave" | "images", item: string) => {
    const current = branding[group] ?? [];
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    updateBranding({ [group]: next });
  };

  // Inspiration ref helpers
  const updateRef = (index: number, field: keyof InspirationRef, value: string) => {
    const refs = [...(inspiration.refs ?? [])];
    refs[index] = { ...refs[index], [field]: value };
    updateInspiration({ refs });
  };

  const addRef = () => {
    updateInspiration({ refs: [...(inspiration.refs ?? []), { url: "", notes: "" }] });
  };

  const removeRef = (index: number) => {
    const refs = (inspiration.refs ?? []).filter((_, i) => i !== index);
    updateInspiration({ refs });
  };

  return (
    <div className="space-y-8">
      {/* Section 4: Branding & Assets */}
      <div>
        <SectionHeader number={4} title="Branding & Assets" />
        <div className="space-y-5">
          {/* Must Have */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Must Have</p>
            <div className="space-y-2">
              {MUST_HAVE_OPTIONS.map((item) => (
                <IntakeCheckbox
                  key={item}
                  label={item}
                  checked={(branding.mustHave ?? []).includes(item)}
                  onChange={() => toggleBrandingItem("mustHave", item)}
                />
              ))}
            </div>
          </div>

          {/* Nice to Have */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Nice to Have</p>
            <div className="space-y-2">
              {NICE_TO_HAVE_OPTIONS.map((item) => (
                <IntakeCheckbox
                  key={item}
                  label={item}
                  checked={(branding.niceToHave ?? []).includes(item)}
                  onChange={() => toggleBrandingItem("niceToHave", item)}
                />
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Images</p>
            <div className="space-y-2">
              {IMAGE_OPTIONS.map((item) => (
                <IntakeCheckbox
                  key={item}
                  label={item}
                  checked={(branding.images ?? []).includes(item)}
                  onChange={() => toggleBrandingItem("images", item)}
                />
              ))}
            </div>
          </div>

          <IntakeInput
            label="Google Drive Folder Link"
            value={branding.googleDriveLink ?? ""}
            onChange={(v) => updateBranding({ googleDriveLink: v })}
            placeholder="https://drive.google.com/..."
          />
        </div>
      </div>

      {/* Section 5: Inspiration & References */}
      <div>
        <SectionHeader number={5} title="Inspiration & References" />
        <div className="space-y-4">
          {/* Reference Rows */}
          <div className="space-y-3">
            {(inspiration.refs ?? []).map((ref, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={ref.url}
                    onChange={(e) => updateRef(index, "url", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                  <input
                    type="text"
                    value={ref.notes}
                    onChange={(e) => updateRef(index, "notes", e.target.value)}
                    placeholder="What do they like about it?"
                    className="w-full rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>
                {(inspiration.refs ?? []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRef(index)}
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
            onClick={addRef}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            <Plus className="size-4" />
            Add another
          </button>

          <IntakeTextarea
            label="Styles they do NOT like"
            value={inspiration.stylesDislike ?? ""}
            onChange={(v) => updateInspiration({ stylesDislike: v })}
            placeholder="Describe design styles or patterns the client wants to avoid..."
          />
        </div>
      </div>
    </div>
  );
}
