import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../ui/command";
import { Check, CalendarBlank, Buildings } from "@phosphor-icons/react/dist/ssr";
import { useClients } from "@/hooks/useClients";
import type { ProjectData } from "../types";
import type { IntakeProjectInfo, IntakeProjectTypes } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_TYPE_OPTIONS = [
  "Landing Page",
  "Multi-page Website",
  "Mobile App",
  "Web App",
  "Redesign/Revamp",
  "Other",
];

// ─── Reusable Components ──────────────────────────────────────────────────────

/** Numbered section header used across all intake steps */
export function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 mb-4 border-b border-border">
      <div className="flex items-center justify-center size-7 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

/** Standard text input with intake styling */
export function IntakeInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
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
  );
}

/** Custom styled checkbox with blue fill and line-through */
export function IntakeCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-2.5 group cursor-pointer text-left"
    >
      <div
        className={cn(
          "flex items-center justify-center size-5 rounded border transition-all shrink-0 mt-0.5",
          checked
            ? "bg-blue-600 border-blue-600"
            : "bg-white dark:bg-muted border-border hover:border-blue-400"
        )}
      >
        {checked && <Check className="size-3 text-white" weight="bold" />}
      </div>
      <span
        className={cn(
          "text-sm transition-all break-words flex-1",
          checked ? "line-through text-muted-foreground" : "text-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}

/** Date picker for intake forms */
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

interface StepIntakeInfoProps {
  data: ProjectData;
  updateData: (updates: Partial<ProjectData>) => void;
}

export function StepIntakeInfo({ data, updateData }: StepIntakeInfoProps) {
  const { clients } = useClients();
  const [clientOpen, setClientOpen] = useState(false);

  // Initialize intake sections if needed
  const info: IntakeProjectInfo = data.intake?.projectInfo ?? {};
  const types: IntakeProjectTypes = data.intake?.projectTypes ?? { types: [], otherType: "" };

  const updateInfo = (updates: Partial<IntakeProjectInfo>) => {
    updateData({
      intake: {
        ...data.intake,
        projectInfo: { ...info, ...updates },
      },
    });
  };

  const updateTypes = (updates: Partial<IntakeProjectTypes>) => {
    updateData({
      intake: {
        ...data.intake,
        projectTypes: { ...types, ...updates },
      },
    });
  };

  const toggleType = (type: string) => {
    const current = types.types ?? [];
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    updateTypes({ types: next });
  };

  // Find selected client name
  const selectedClient = clients.find((c) => c.id === data.intakeClientId);

  return (
    <div className="space-y-8">
      {/* Project name + client (top-level fields) */}
      <div className="space-y-4">
        <IntakeInput
          label="Project Name"
          value={data.intakeProjectName ?? ""}
          onChange={(v) => updateData({ intakeProjectName: v })}
          placeholder="e.g., Acme Corp Website Redesign"
        />

        {/* Client Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Client</label>
          <Popover open={clientOpen} onOpenChange={setClientOpen}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-2 rounded-lg border border-border bg-gray-50 dark:bg-muted px-3 py-2 text-sm text-left hover:border-blue-400 transition-colors">
                <Buildings className="size-4 text-muted-foreground" />
                <span className={selectedClient ? "text-foreground" : "text-muted-foreground"}>
                  {selectedClient?.companyName ?? "Select client"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[280px]" align="start">
              <Command>
                <CommandInput placeholder="Search clients..." />
                <CommandList>
                  <CommandEmpty>No clients found.</CommandEmpty>
                  <CommandGroup>
                    {clients.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.companyName}
                        onSelect={() => {
                          updateData({ intakeClientId: c.id });
                          setClientOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Buildings className="size-4 text-muted-foreground" />
                          <span className="flex-1">{c.companyName}</span>
                          {c.id === data.intakeClientId && <Check className="size-4" />}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Section 0: Project Info */}
      <div>
        <SectionHeader number={0} title="Project Info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IntakeDatePicker label="Date Sold" date={info.dateSold} onSelect={(d) => updateInfo({ dateSold: d })} />
          <IntakeDatePicker label="Deadline" date={info.deadline} onSelect={(d) => updateInfo({ deadline: d })} />
          <IntakeInput label="Sales Contact" value={info.salesContact ?? ""} onChange={(v) => updateInfo({ salesContact: v })} placeholder="Name" />
          <IntakeInput label="Client Contact" value={info.clientContact ?? ""} onChange={(v) => updateInfo({ clientContact: v })} placeholder="Name" />
          <IntakeInput label="Client Email" value={info.clientEmail ?? ""} onChange={(v) => updateInfo({ clientEmail: v })} placeholder="email@example.com" type="email" />
          <IntakeInput label="Client Phone" value={info.clientPhone ?? ""} onChange={(v) => updateInfo({ clientPhone: v })} placeholder="+1 (555) 000-0000" type="tel" />
        </div>
      </div>

      {/* Section 1: Project Type */}
      <div>
        <SectionHeader number={1} title="Project Type" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROJECT_TYPE_OPTIONS.map((type) => (
            <IntakeCheckbox
              key={type}
              label={type}
              checked={(types.types ?? []).includes(type)}
              onChange={() => toggleType(type)}
            />
          ))}
        </div>
        {(types.types ?? []).includes("Other") && (
          <div className="mt-3">
            <IntakeInput
              label="Other (please specify)"
              value={types.otherType ?? ""}
              onChange={(v) => updateTypes({ otherType: v })}
              placeholder="Describe the project type"
            />
          </div>
        )}
      </div>
    </div>
  );
}
