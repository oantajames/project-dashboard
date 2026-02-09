import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { SectionHeader, IntakeInput, IntakeCheckbox } from "./StepIntakeInfo";
import { IntakeTextarea } from "./StepIntakeScopeContent";
import type { ProjectData } from "../types";
import type { IntakeAccessLogins, IntakeBudgetTimeline } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCESS_OPTIONS = [
  "Domain registrar",
  "Hosting",
  "CMS",
  "Social media",
  "Google Analytics",
  "Other",
];

// ─── Date Picker ──────────────────────────────────────────────────────────────

function IntakeDatePicker({
  label,
  date,
  onSelect,
}: {
  label: string;
  date?: string;
  onSelect: (date: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsedDate = date ? new Date(date) : undefined;

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
              onSelect(d ? d.toISOString() : undefined);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface StepIntakeBudgetAccessProps {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
}

export function StepIntakeBudgetAccess({ data, updateData }: StepIntakeBudgetAccessProps) {
  const access: IntakeAccessLogins = data.intake?.accessLogins ?? { selected: [] };
  const budget: IntakeBudgetTimeline = data.intake?.budgetTimeline ?? {};
  const extraNotes = data.intake?.extraNotes ?? "";

  const updateAccess = (updates: Partial<IntakeAccessLogins>) => {
    updateData({
      intake: {
        ...data.intake,
        accessLogins: { ...access, ...updates },
      },
    });
  };

  const updateBudget = (updates: Partial<IntakeBudgetTimeline>) => {
    updateData({
      intake: {
        ...data.intake,
        budgetTimeline: { ...budget, ...updates },
      },
    });
  };

  const toggleAccess = (item: string) => {
    const current = access.selected ?? [];
    const next = current.includes(item) ? current.filter((a) => a !== item) : [...current, item];
    updateAccess({ selected: next });
  };

  return (
    <div className="space-y-8">
      {/* Section 8: Access & Logins */}
      <div>
        <SectionHeader number={8} title="Access & Logins" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACCESS_OPTIONS.map((item) => (
              <IntakeCheckbox
                key={item}
                label={item}
                checked={(access.selected ?? []).includes(item)}
                onChange={() => toggleAccess(item)}
              />
            ))}
          </div>
          {(access.selected ?? []).includes("Other") && (
            <IntakeInput
              label="Other access (please specify)"
              value={access.other ?? ""}
              onChange={(v) => updateAccess({ other: v })}
              placeholder="Describe other access needed"
            />
          )}
          <p className="text-xs text-muted-foreground italic">
            Note: Please share credentials securely, not in this form.
          </p>
        </div>
      </div>

      {/* Section 9: Budget & Timeline */}
      <div>
        <SectionHeader number={9} title="Budget & Timeline" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IntakeInput
            label="Total Price"
            value={budget.totalPrice ?? ""}
            onChange={(v) => updateBudget({ totalPrice: v })}
            placeholder="e.g., $5,000"
          />
          <IntakeInput
            label="Payment Structure"
            value={budget.paymentStructure ?? ""}
            onChange={(v) => updateBudget({ paymentStructure: v })}
            placeholder="e.g., 50% upfront, 50% on delivery"
          />
          <IntakeDatePicker
            label="Start Date"
            date={budget.startDate}
            onSelect={(d) => updateBudget({ startDate: d })}
          />
          <IntakeDatePicker
            label="Expected Delivery"
            date={budget.expectedDelivery}
            onSelect={(d) => updateBudget({ expectedDelivery: d })}
          />
          <IntakeDatePicker
            label="Hard Deadline"
            date={budget.hardDeadline}
            onSelect={(d) => updateBudget({ hardDeadline: d })}
          />
        </div>
      </div>

      {/* Section 10: Extra Notes */}
      <div>
        <SectionHeader number={10} title="Extra Notes" />
        <IntakeTextarea
          label="Anything else?"
          value={extraNotes}
          onChange={(v) =>
            updateData({
              intake: {
                ...data.intake,
                extraNotes: v,
              },
            })
          }
          placeholder="Add any other notes, requirements, or context..."
          rows={5}
        />
      </div>
    </div>
  );
}
