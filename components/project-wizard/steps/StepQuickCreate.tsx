import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../../ui/calendar";
import { Button } from "../../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { Check, X, CalendarBlank, UserCircle, Spinner, List, Paperclip, Microphone, Rows, ChartBar, Tag, Buildings } from "@phosphor-icons/react/dist/ssr";
import { ProjectDescriptionEditor } from "../ProjectDescriptionEditor";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import type { CreateProjectData, ProjectStatus, ProjectPriority } from "@/lib/types";

// --- Static Options ---

const STATUSES: { id: ProjectStatus; label: string; dotClass: string }[] = [
  { id: "backlog", label: "Backlog", dotClass: "bg-orange-600" },
  { id: "planned", label: "Planned", dotClass: "bg-neutral-300" },
  { id: "active", label: "Active", dotClass: "bg-yellow-400" },
  { id: "completed", label: "Completed", dotClass: "bg-green-600" },
  { id: "cancelled", label: "Cancelled", dotClass: "bg-neutral-400" },
];

const PRIORITIES: { id: ProjectPriority; label: string }[] = [
  { id: "urgent", label: "Urgent" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const PROJECT_TYPES = [
  { id: "mvp", label: "MVP" },
  { id: "revamp", label: "Revamp" },
  { id: "audit", label: "Audit" },
  { id: "design-sprint", label: "Design Sprint" },
  { id: "dev-sprint", label: "Dev Sprint" },
];

const PROJECT_GROUPS = [
  { id: "design", label: "Design" },
  { id: "development", label: "Development" },
  { id: "marketing", label: "Marketing" },
  { id: "research", label: "Research" },
];

const TAGS = [
  { id: "bug", label: "Bug", color: "var(--chart-5)" },
  { id: "feature", label: "Feature", color: "var(--chart-2)" },
  { id: "enhancement", label: "Enhancement", color: "var(--chart-4)" },
  { id: "docs", label: "Documentation", color: "var(--chart-3)" },
];

// --- Pickers ---

interface PickerProps<T> {
  trigger: React.ReactNode;
  items: T[];
  onSelect: (item: T) => void;
  selectedId?: string;
  placeholder?: string;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
}

function GenericPicker<
  T extends { id: string; label?: string; name?: string },
>({
  trigger,
  items,
  onSelect,
  selectedId,
  placeholder = "Search...",
  renderItem,
}: PickerProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="p-0 w-[240px]" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label || item.name || item.id}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {renderItem(item, item.id === selectedId)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  trigger: React.ReactNode;
}

function DatePicker({
  date,
  onSelect,
  trigger,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onSelect(d);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// --- Main Component ---

interface StepQuickCreateProps {
  onClose: () => void;
  onCreate: (data: CreateProjectData) => void;
  onExpandChange?: (isExpanded: boolean) => void;
}

export function StepQuickCreate({
  onClose,
  onCreate,
  onExpandChange,
}: StepQuickCreateProps) {
  const { user } = useAuth();
  const { clients } = useClients();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const descriptionRef = useRef("");

  // Data State
  const [selectedClient, setSelectedClient] = useState<{ id: string; companyName: string } | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [status, setStatus] = useState(STATUSES[0]); // Backlog default
  const [priority, setPriority] = useState<(typeof PRIORITIES)[0] | null>(null);
  const [projectType, setProjectType] = useState<(typeof PROJECT_TYPES)[0] | null>(null);
  const [projectGroup, setProjectGroup] = useState<(typeof PROJECT_GROUPS)[0] | null>(null);
  const [selectedTag, setSelectedTag] = useState<(typeof TAGS)[0] | null>(null);

  // Set first client as default when clients load
  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient({ id: clients[0].id, companyName: clients[0].companyName });
    }
  }, [clients, selectedClient]);

  useEffect(() => {
    // Focus title on mount
    const timer = setTimeout(() => {
      const titleInput = document.getElementById("quick-create-title");
      if (titleInput) titleInput.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => {
    if (!title.trim() || !selectedClient) return;

    const projectData: CreateProjectData = {
      name: title.trim(),
      clientId: selectedClient.id,
      description: descriptionRef.current || undefined,
      status: status.id,
      priority: priority?.id || "medium",
      startDate,
      endDate: targetDate,
      tags: selectedTag ? [selectedTag.label] : [],
      picUserIds: user ? [user.id] : [],
      supportUserIds: [],
      group: projectGroup?.label,
      typeLabel: projectType?.label,
    };

    onCreate(projectData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleCreate();
    }
  };

  return (
    <div
      className="bg-background relative rounded-3xl size-full font-sans overflow-hidden flex flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Close Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute right-4 top-3 opacity-70 hover:opacity-100 rounded-xl"
      >
        <X className="size-4 text-muted-foreground" />
      </Button>

      <div className="flex flex-col flex-1 p-3.5 px-4 gap-3.5 overflow-hidden">
        {/* Title Input */}
        <div className="flex flex-col gap-2 w-full shrink-0 mt-2">
          <div className="flex gap-1 h-10 items-center w-full">
            <input
              id="quick-create-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="w-full font-normal leading-7 text-foreground placeholder:text-muted-foreground text-xl outline-none bg-transparent border-none p-0"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Description Area (Tiptap) */}
        <ProjectDescriptionEditor onExpandChange={onExpandChange} />

        {/* Property Buttons - Interactive Dropdowns */}
        <div className="flex flex-wrap gap-2.5 items-start w-full shrink-0">
          {/* Client Picker */}
          <GenericPicker
            items={clients.map(c => ({ id: c.id, label: c.companyName, companyName: c.companyName }))}
            onSelect={(item) => setSelectedClient({ id: item.id, companyName: item.companyName })}
            selectedId={selectedClient?.id}
            placeholder="Select client..."
            renderItem={(item, isSelected) => (
              <div className="flex items-center gap-2 w-full">
                <Buildings className="size-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                {isSelected && <Check className="size-4" />}
              </div>
            )}
            trigger={
              <button className="bg-muted flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <Buildings className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm leading-5">
                  {selectedClient ? selectedClient.companyName : "Select Client"}
                </span>
              </button>
            }
          />

          {/* Start Date Picker */}
          <DatePicker
            date={startDate}
            onSelect={setStartDate}
            trigger={
              <button className="bg-muted flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <CalendarBlank className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm leading-5">
                  {startDate
                    ? `Start: ${format(startDate, "dd/MM/yyyy")}`
                    : "Start Date"}
                </span>
              </button>
            }
          />

          {/* Target Date Picker */}
          <DatePicker
            date={targetDate}
            onSelect={setTargetDate}
            trigger={
              <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
                <CalendarBlank className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm leading-5">
                  {targetDate
                    ? `Due: ${format(targetDate, "dd/MM/yyyy")}`
                    : "Due Date"}
                </span>
              </button>
            }
          />

          {/* Status Picker */}
          <GenericPicker
            items={STATUSES}
            onSelect={setStatus}
            selectedId={status.id}
            placeholder="Change status..."
            renderItem={(item, isSelected) => (
              <div className="flex items-center gap-2 w-full">
                <div className={cn("size-3 rounded-full", item.dotClass)} />
                <span className="flex-1">{item.label}</span>
                {isSelected && <Check className="size-4" />}
              </div>
            )}
            trigger={
              <button
                className={cn(
                  "flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border transition-colors",
                  "bg-background hover:bg-black/5",
                )}
              >
                <Spinner className="size-4 text-muted-foreground" />
                <div className={cn("size-2 rounded-full", status.dotClass)} />
                <span className="font-medium text-foreground text-sm leading-5">
                  {status.label}
                </span>
              </button>
            }
          />

          {/* Priority Picker */}
          <GenericPicker
            items={PRIORITIES}
            onSelect={setPriority}
            selectedId={priority?.id}
            placeholder="Set priority..."
            renderItem={(item, isSelected) => (
              <div className="flex items-center gap-2 w-full">
                <span className="flex-1">{item.label}</span>
                {isSelected && <Check className="size-4" />}
              </div>
            )}
            trigger={
              <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
                <ChartBar className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm leading-5">
                  {priority ? priority.label : "Priority"}
                </span>
              </button>
            }
          />

          {/* Project Type Picker */}
          <GenericPicker
            items={PROJECT_TYPES}
            onSelect={setProjectType}
            selectedId={projectType?.id}
            placeholder="Select type..."
            renderItem={(item, isSelected) => (
              <div className="flex items-center gap-2 w-full">
                <span className="flex-1">{item.label}</span>
                {isSelected && <Check className="size-4" />}
              </div>
            )}
            trigger={
              <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
                <List className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm leading-5">
                  {projectType ? projectType.label : "Type"}
                </span>
              </button>
            }
          />

          {/* Project Group Picker */}
          <GenericPicker
            items={PROJECT_GROUPS}
            onSelect={setProjectGroup}
            selectedId={projectGroup?.id}
            placeholder="Select group..."
            renderItem={(item, isSelected) => (
              <div className="flex items-center gap-2 w-full">
                <span className="flex-1">{item.label}</span>
                {isSelected && <Check className="size-4" />}
              </div>
            )}
            trigger={
              <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
                <Rows className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm leading-5">
                  {projectGroup ? projectGroup.label : "Group"}
                </span>
              </button>
            }
          />

          {/* Tag Picker */}
          <GenericPicker
            items={TAGS}
            onSelect={setSelectedTag}
            selectedId={selectedTag?.id}
            placeholder="Add tag..."
            renderItem={(item, isSelected) => (
              <div className="flex items-center gap-2 w-full">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1">{item.label}</span>
                {isSelected && <Check className="size-4" />}
              </div>
            )}
            trigger={
              <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
                <Tag className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm leading-5">
                  {selectedTag ? selectedTag.label : "Tag"}
                </span>
              </button>
            }
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto w-full pt-4 shrink-0">
          <div className="flex items-center">
            <button className="flex items-center justify-center size-10 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
              <Paperclip className="size-4 text-muted-foreground" />
            </button>
            <button className="flex items-center justify-center size-10 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
              <Microphone className="size-4 text-muted-foreground" />
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={!title.trim() || !selectedClient}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex gap-3 h-10 items-center justify-center px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <span className="font-medium text-primary-foreground text-sm leading-5">
              Create Project
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}