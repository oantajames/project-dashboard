"use client"

/**
 * Tiny Brain — Agent Knowledge & Settings
 *
 * Friendly 3-tab dialog for viewing and editing the AI agent's knowledge base,
 * skills, and boundaries. Designed for non-technical users with plain-English
 * labels and helpful descriptions.
 *
 * Tabs:
 * - About: Product description, data model, coding patterns, style guide, scope rules
 * - Skills: Manage agent capabilities with friendly labels
 * - Boundaries: Control what the agent can/cannot change
 *
 * All edits are persisted to Firestore and merged with static defaults at runtime.
 */

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Plus,
  Trash,
  FloppyDisk,
  ArrowsClockwise,
  CaretDown,
  CaretRight,
  Brain,
  Lightning,
  ShieldCheck,
} from "@phosphor-icons/react"
import { useAICoderConfig } from "@/hooks/useAICoderConfig"
import { DEFAULT_PRODUCT_CONTEXT } from "@/lib/ai-coder/product-context"
import { TinyFace } from "./TinyFace"
import type { AICoderRules, AICoderSkill, AICoderProductContext } from "@/lib/ai-coder/types"

interface TinyBrainProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TinyBrain({ open, onOpenChange }: TinyBrainProps) {
  const {
    config,
    loading,
    updateRules,
    updateSkills,
    updateProductContext,
  } = useAICoderConfig()

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("about")

  // ── About tab state ──
  const [productDescription, setProductDescription] = useState("")
  const [dataModel, setDataModel] = useState("")
  const [firestorePatterns, setFirestorePatterns] = useState("")
  const [styleGuide, setStyleGuide] = useState("")
  const [scopeRules, setScopeRules] = useState("")

  // ── Rules state ──
  const [allowed, setAllowed] = useState<string[]>([])
  const [blocked, setBlocked] = useState<string[]>([])
  const [constraints, setConstraints] = useState<string[]>([])
  const [allowNewFiles, setAllowNewFiles] = useState(true)
  const [allowDeleteFiles, setAllowDeleteFiles] = useState(false)
  const [allowDependencyChanges, setAllowDependencyChanges] = useState(false)

  // ── Skills state ──
  const [skills, setSkills] = useState<AICoderSkill[]>([])

  // Sync local state when config loads
  useEffect(() => {
    if (!loading) {
      // Product context (use merged values which include defaults)
      const ctx = config.productContext || DEFAULT_PRODUCT_CONTEXT
      setProductDescription(ctx.productDescription)
      setDataModel(ctx.dataModel)
      setFirestorePatterns(ctx.firestorePatterns)
      setStyleGuide(ctx.styleGuide)
      setScopeRules(ctx.scopeRules)

      // Rules
      setAllowed([...config.rules.allowed])
      setBlocked([...config.rules.blocked])
      setConstraints([...config.rules.constraints])
      setAllowNewFiles(config.rules.allowNewFiles)
      setAllowDeleteFiles(config.rules.allowDeleteFiles)
      setAllowDependencyChanges(config.rules.allowDependencyChanges)

      // Skills
      setSkills(config.skills.map((s) => ({ ...s })))
    }
  }, [config, loading])

  // ── Save handlers ──

  const handleSaveAbout = useCallback(async () => {
    setSaving(true)
    try {
      await updateProductContext({
        productDescription,
        dataModel,
        firestorePatterns,
        styleGuide,
        scopeRules,
      })
    } catch (err) {
      console.error("[TinyBrain] Failed to save product context:", err)
    } finally {
      setSaving(false)
    }
  }, [productDescription, dataModel, firestorePatterns, styleGuide, scopeRules, updateProductContext])

  const handleSaveRules = useCallback(async () => {
    setSaving(true)
    try {
      await updateRules({
        allowed: allowed.filter(Boolean),
        blocked: blocked.filter(Boolean),
        constraints: constraints.filter(Boolean),
        allowNewFiles,
        allowDeleteFiles,
        allowDependencyChanges,
      })
    } catch (err) {
      console.error("[TinyBrain] Failed to save rules:", err)
    } finally {
      setSaving(false)
    }
  }, [allowed, blocked, constraints, allowNewFiles, allowDeleteFiles, allowDependencyChanges, updateRules])

  const handleSaveSkills = useCallback(async () => {
    setSaving(true)
    try {
      await updateSkills(skills.filter((s) => s.name.trim()))
    } catch (err) {
      console.error("[TinyBrain] Failed to save skills:", err)
    } finally {
      setSaving(false)
    }
  }, [skills, updateSkills])

  // ── Reset handlers ──

  const handleResetAbout = () => {
    setProductDescription(DEFAULT_PRODUCT_CONTEXT.productDescription)
    setDataModel(DEFAULT_PRODUCT_CONTEXT.dataModel)
    setFirestorePatterns(DEFAULT_PRODUCT_CONTEXT.firestorePatterns)
    setStyleGuide(DEFAULT_PRODUCT_CONTEXT.styleGuide)
    setScopeRules(DEFAULT_PRODUCT_CONTEXT.scopeRules)
  }

  const handleResetRules = () => {
    setAllowed([...config.rules.allowed])
    setBlocked([...config.rules.blocked])
    setConstraints([...config.rules.constraints])
    setAllowNewFiles(config.rules.allowNewFiles)
    setAllowDeleteFiles(config.rules.allowDeleteFiles)
    setAllowDependencyChanges(config.rules.allowDependencyChanges)
  }

  const handleResetSkills = () => {
    setSkills(config.skills.map((s) => ({ ...s })))
  }

  // ── List helpers ──

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""])
  }

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((v, i) => (i === index ? value : v)))
  }

  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <TinyFace className="text-xs text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-base">Tiny Brain</DialogTitle>
              <DialogDescription className="text-xs">
                What your agent knows and how it behaves
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about" className="text-xs gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                About
              </TabsTrigger>
              <TabsTrigger value="skills" className="text-xs gap-1.5">
                <Lightning className="h-3.5 w-3.5" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="boundaries" className="text-xs gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Boundaries
              </TabsTrigger>
            </TabsList>

            {/* ── About Tab ── */}
            <TabsContent value="about" className="flex-1 overflow-y-auto pr-1 mt-4 space-y-5">
              <ContextSection
                label="What is this product?"
                description="Describe your product so the agent understands what it's building and who it's for."
                value={productDescription}
                onChange={setProductDescription}
                rows={4}
              />

              <Separator />

              <ContextSection
                label="How data is connected"
                description="Explain the main entities (clients, projects, invoices, etc.) and how they relate to each other."
                value={dataModel}
                onChange={setDataModel}
                rows={5}
              />

              <Separator />

              <ContextSection
                label="Design style"
                description="Describe the visual style so the agent keeps a consistent look and feel."
                value={styleGuide}
                onChange={setStyleGuide}
                rows={4}
              />

              <Separator />

              <ContextSection
                label="How it should behave"
                description="Rules for staying in scope, asking questions, and handling unclear requests."
                value={scopeRules}
                onChange={setScopeRules}
                rows={3}
              />

              {/* Advanced: Firestore patterns */}
              <AdvancedSection label="Coding patterns (advanced)">
                <ContextSection
                  label="Firestore & code patterns"
                  description="Technical patterns for how database operations and code should be structured."
                  value={firestorePatterns}
                  onChange={setFirestorePatterns}
                  rows={6}
                />
              </AdvancedSection>

              <SaveBar
                saving={saving}
                onSave={handleSaveAbout}
                onReset={handleResetAbout}
                saveLabel="Save Knowledge"
              />
            </TabsContent>

            {/* ── Skills Tab ── */}
            <TabsContent value="skills" className="flex-1 overflow-y-auto pr-1 mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Skills define what the agent can do. Each skill has its own personality and scope.
              </p>

              {skills.map((skill, index) => (
                <FriendlySkillEditor
                  key={skill.id}
                  skill={skill}
                  onUpdate={(field, value) =>
                    setSkills((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
                    )
                  }
                  onRemove={() => setSkills((prev) => prev.filter((_, i) => i !== index))}
                />
              ))}

              <Button
                onClick={() =>
                  setSkills((prev) => [
                    ...prev,
                    {
                      id: `skill-${Date.now()}`,
                      name: "New Skill",
                      description: "",
                      icon: "Sparkle",
                      prompt: "",
                      allowedPaths: [],
                    },
                  ])
                }
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Skill
              </Button>

              <SaveBar
                saving={saving}
                onSave={handleSaveSkills}
                onReset={handleResetSkills}
                saveLabel="Save Skills"
              />
            </TabsContent>

            {/* ── Boundaries Tab ── */}
            <TabsContent value="boundaries" className="flex-1 overflow-y-auto pr-1 mt-4 space-y-5">
              {/* Toggle switches */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Permissions</Label>
                <ToggleRow
                  label="Allow creating new files"
                  description="The agent can create new component or utility files"
                  checked={allowNewFiles}
                  onCheckedChange={setAllowNewFiles}
                />
                <ToggleRow
                  label="Allow deleting files"
                  description="The agent can remove files from the codebase"
                  checked={allowDeleteFiles}
                  onCheckedChange={setAllowDeleteFiles}
                />
                <ToggleRow
                  label="Allow adding packages"
                  description="The agent can install new npm dependencies"
                  checked={allowDependencyChanges}
                  onCheckedChange={setAllowDependencyChanges}
                />
              </div>

              <Separator />

              {/* Allowed paths */}
              <TagListSection
                label="The agent CAN change"
                description="File patterns the agent is allowed to modify"
                items={allowed}
                placeholder="e.g. components/**"
                onAdd={() => addItem(setAllowed)}
                onUpdate={(i, v) => updateItem(setAllowed, i, v)}
                onRemove={(i) => removeItem(setAllowed, i)}
              />

              <Separator />

              {/* Blocked paths */}
              <TagListSection
                label="The agent CANNOT change"
                description="File patterns that are off-limits"
                items={blocked}
                placeholder="e.g. lib/firebase/**"
                onAdd={() => addItem(setBlocked)}
                onUpdate={(i, v) => updateItem(setBlocked, i, v)}
                onRemove={(i) => removeItem(setBlocked, i)}
              />

              <Separator />

              {/* Constraints */}
              <div className="space-y-2.5">
                <div>
                  <Label className="text-sm font-medium">Rules to always follow</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Instructions the agent must obey on every request
                  </p>
                </div>
                <div className="space-y-2">
                  {constraints.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Textarea
                        value={item}
                        onChange={(e) => updateItem(setConstraints, index, e.target.value)}
                        placeholder="e.g. Do NOT modify authentication logic"
                        className="text-sm min-h-[38px] resize-none"
                        rows={2}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(setConstraints, index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => addItem(setConstraints)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add rule
                </Button>
              </div>

              <SaveBar
                saving={saving}
                onSave={handleSaveRules}
                onReset={handleResetRules}
                saveLabel="Save Boundaries"
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ──

/** Textarea section with label and description */
function ContextSection({
  label,
  description,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm resize-none"
        rows={rows}
      />
    </div>
  )
}

/** Collapsible advanced section */
function AdvancedSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {open ? (
          <CaretDown className="h-3 w-3" />
        ) : (
          <CaretRight className="h-3 w-3" />
        )}
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}

/** Toggle switch with label and description */
function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

/** Editable list of path patterns shown as input rows */
function TagListSection({
  label,
  description,
  items,
  placeholder,
  onAdd,
  onUpdate,
  onRemove,
}: {
  label: string
  description: string
  items: string[]
  placeholder: string
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              placeholder={placeholder}
              className="text-sm h-9 font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(index)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={onAdd} variant="outline" size="sm" className="text-xs h-8">
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add path
      </Button>
    </div>
  )
}

/** Friendly skill editor card */
function FriendlySkillEditor({
  skill,
  onUpdate,
  onRemove,
}: {
  skill: AICoderSkill
  onUpdate: (field: keyof AICoderSkill, value: unknown) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
            {skill.id}
          </Badge>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium text-foreground hover:text-blue-500 transition-colors truncate text-left"
          >
            {skill.name || "Untitled Skill"}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {skill.requiresApproval && (
            <Badge variant="outline" className="text-[9px] shrink-0">
              Approval needed
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Collapsed summary */}
      {!expanded && skill.description && (
        <p className="text-xs text-muted-foreground pl-1">
          {skill.description}
        </p>
      )}

      {/* Expanded editor */}
      {expanded && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={skill.name}
                onChange={(e) => onUpdate("name", e.target.value)}
                placeholder="Skill name"
                className="text-sm h-8 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Icon</Label>
              <Input
                value={skill.icon}
                onChange={(e) => onUpdate("icon", e.target.value)}
                placeholder="Phosphor icon name"
                className="text-sm h-8 mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Short description</Label>
            <Input
              value={skill.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              placeholder="What this skill is for"
              className="text-sm h-8 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">What this skill does</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">
              Instructions that shape how the agent behaves when this skill is active
            </p>
            <Textarea
              value={skill.prompt}
              onChange={(e) => onUpdate("prompt", e.target.value)}
              placeholder="Describe how the agent should approach tasks with this skill..."
              className="text-sm mt-1 min-h-[80px]"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-xs">Files it can change</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">
              Comma-separated file patterns (e.g., components/**, app/**)
            </p>
            <Input
              value={(skill.allowedPaths || []).join(", ")}
              onChange={(e) =>
                onUpdate(
                  "allowedPaths",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="e.g. components/**, app/**"
              className="text-sm h-8 mt-1 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <p className="text-xs font-medium">Needs your approval</p>
              <p className="text-[10px] text-muted-foreground">
                Require manual approval before changes are merged
              </p>
            </div>
            <Switch
              checked={skill.requiresApproval || false}
              onCheckedChange={(checked) => onUpdate("requiresApproval", checked)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/** Save and reset button bar */
function SaveBar({
  saving,
  onSave,
  onReset,
  saveLabel,
}: {
  saving: boolean
  onSave: () => void
  onReset: () => void
  saveLabel: string
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-4">
      <Button onClick={onSave} disabled={saving} size="sm">
        <FloppyDisk className="h-4 w-4 mr-1.5" weight="bold" />
        {saving ? "Saving..." : saveLabel}
      </Button>
      <Button onClick={onReset} variant="ghost" size="sm">
        <ArrowsClockwise className="h-4 w-4 mr-1.5" />
        Reset to defaults
      </Button>
    </div>
  )
}
