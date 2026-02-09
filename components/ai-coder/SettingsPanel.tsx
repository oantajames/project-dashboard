"use client"

/**
 * Tiny Viber — Settings Panel
 *
 * Two-tab dialog for editing AI Coder rules and skills.
 * Saves overrides to Firestore via the config hook.
 *
 * - Rules tab: editable lists for allowed, blocked, constraints
 * - Skills tab: inline editing for name, description, prompt, allowedPaths
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
import { Plus, Trash, FloppyDisk, ArrowsClockwise } from "@phosphor-icons/react"
import { useAICoderConfig } from "@/hooks/useAICoderConfig"
import type { AICoderRules, AICoderSkill } from "@/lib/ai-coder/types"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { config, loading, updateRules, updateSkills } = useAICoderConfig()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("rules")

  // ── Rules state ──
  const [allowed, setAllowed] = useState<string[]>([])
  const [blocked, setBlocked] = useState<string[]>([])
  const [constraints, setConstraints] = useState<string[]>([])

  // ── Skills state ──
  const [skills, setSkills] = useState<AICoderSkill[]>([])

  // Sync local state when config loads / changes
  useEffect(() => {
    if (!loading) {
      setAllowed([...config.rules.allowed])
      setBlocked([...config.rules.blocked])
      setConstraints([...config.rules.constraints])
      setSkills(config.skills.map((s) => ({ ...s })))
    }
  }, [config, loading])

  // ── Rules Handlers ──

  const handleAddItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => [...prev, ""])
  }

  const handleUpdateItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((v, i) => (i === index ? value : v)))
  }

  const handleRemoveItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveRules = useCallback(async () => {
    setSaving(true)
    try {
      await updateRules({
        allowed: allowed.filter(Boolean),
        blocked: blocked.filter(Boolean),
        constraints: constraints.filter(Boolean),
      })
    } catch (err) {
      console.error("[TinyViber] Failed to save rules:", err)
    } finally {
      setSaving(false)
    }
  }, [allowed, blocked, constraints, updateRules])

  // ── Skills Handlers ──

  const handleUpdateSkill = (index: number, field: keyof AICoderSkill, value: unknown) => {
    setSkills((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }

  const handleAddSkill = () => {
    const newSkill: AICoderSkill = {
      id: `skill-${Date.now()}`,
      name: "New Skill",
      description: "",
      icon: "Sparkle",
      prompt: "",
      allowedPaths: [],
    }
    setSkills((prev) => [...prev, newSkill])
  }

  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveSkills = useCallback(async () => {
    setSaving(true)
    try {
      // Filter out skills with empty names
      const validSkills = skills.filter((s) => s.name.trim())
      await updateSkills(validSkills)
    } catch (err) {
      console.error("[TinyViber] Failed to save skills:", err)
    } finally {
      setSaving(false)
    }
  }, [skills, updateSkills])

  // ── Reset handlers ──

  const handleResetRules = () => {
    setAllowed([...config.rules.allowed])
    setBlocked([...config.rules.blocked])
    setConstraints([...config.rules.constraints])
  }

  const handleResetSkills = () => {
    setSkills(config.skills.map((s) => ({ ...s })))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tiny Viber Settings</DialogTitle>
          <DialogDescription>
            Configure AI rules, constraints, and skills. Changes are saved to your project.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            {/* ── Rules Tab ── */}
            <TabsContent value="rules" className="flex-1 overflow-y-auto pr-1 mt-4 space-y-6">
              {/* Allowed paths */}
              <EditableListSection
                label="Allowed Paths"
                description="Glob patterns for files the AI can modify"
                items={allowed}
                placeholder="e.g. components/**"
                onAdd={() => handleAddItem(setAllowed)}
                onUpdate={(i, v) => handleUpdateItem(setAllowed, i, v)}
                onRemove={(i) => handleRemoveItem(setAllowed, i)}
              />

              <Separator />

              {/* Blocked paths */}
              <EditableListSection
                label="Blocked Paths"
                description="Glob patterns for files the AI cannot modify"
                items={blocked}
                placeholder="e.g. lib/firebase/**"
                onAdd={() => handleAddItem(setBlocked)}
                onUpdate={(i, v) => handleUpdateItem(setBlocked, i, v)}
                onRemove={(i) => handleRemoveItem(setBlocked, i)}
              />

              <Separator />

              {/* Constraints */}
              <EditableListSection
                label="Constraints"
                description="Natural language rules injected into the system prompt"
                items={constraints}
                placeholder="e.g. Do NOT modify authentication logic"
                onAdd={() => handleAddItem(setConstraints)}
                onUpdate={(i, v) => handleUpdateItem(setConstraints, i, v)}
                onRemove={(i) => handleRemoveItem(setConstraints, i)}
                multiline
              />

              {/* Save / Reset buttons */}
              <div className="flex items-center gap-2 pt-2 pb-4">
                <Button onClick={handleSaveRules} disabled={saving} size="sm">
                  <FloppyDisk className="h-4 w-4 mr-1.5" weight="bold" />
                  {saving ? "Saving..." : "Save Rules"}
                </Button>
                <Button onClick={handleResetRules} variant="ghost" size="sm">
                  <ArrowsClockwise className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
              </div>
            </TabsContent>

            {/* ── Skills Tab ── */}
            <TabsContent value="skills" className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
              {skills.map((skill, index) => (
                <SkillEditor
                  key={skill.id}
                  skill={skill}
                  onUpdate={(field, value) => handleUpdateSkill(index, field, value)}
                  onRemove={() => handleRemoveSkill(index)}
                />
              ))}

              <Button onClick={handleAddSkill} variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Skill
              </Button>

              {/* Save / Reset buttons */}
              <div className="flex items-center gap-2 pt-2 pb-4">
                <Button onClick={handleSaveSkills} disabled={saving} size="sm">
                  <FloppyDisk className="h-4 w-4 mr-1.5" weight="bold" />
                  {saving ? "Saving..." : "Save Skills"}
                </Button>
                <Button onClick={handleResetSkills} variant="ghost" size="sm">
                  <ArrowsClockwise className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Editable List Section ──

interface EditableListSectionProps {
  label: string
  description: string
  items: string[]
  placeholder: string
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
  multiline?: boolean
}

function EditableListSection({
  label,
  description,
  items,
  placeholder,
  onAdd,
  onUpdate,
  onRemove,
  multiline = false,
}: EditableListSectionProps) {
  return (
    <div className="space-y-2.5">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            {multiline ? (
              <Textarea
                value={item}
                onChange={(e) => onUpdate(index, e.target.value)}
                placeholder={placeholder}
                className="text-sm min-h-[38px] resize-none"
                rows={2}
              />
            ) : (
              <Input
                value={item}
                onChange={(e) => onUpdate(index, e.target.value)}
                placeholder={placeholder}
                className="text-sm h-9"
              />
            )}
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
        Add {label.toLowerCase().replace(/s$/, "")}
      </Button>
    </div>
  )
}

// ── Skill Editor ──

interface SkillEditorProps {
  skill: AICoderSkill
  onUpdate: (field: keyof AICoderSkill, value: unknown) => void
  onRemove: () => void
}

function SkillEditor({ skill, onUpdate, onRemove }: SkillEditorProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {skill.id}
          </Badge>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium text-foreground hover:text-blue-500 transition-colors truncate text-left"
          >
            {skill.name || "Untitled Skill"}
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expandable fields */}
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
            <Label className="text-xs">Description</Label>
            <Input
              value={skill.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              placeholder="Short description"
              className="text-sm h-8 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">System Prompt</Label>
            <Textarea
              value={skill.prompt}
              onChange={(e) => onUpdate("prompt", e.target.value)}
              placeholder="Instructions for the AI when this skill is active..."
              className="text-sm mt-1 min-h-[80px]"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-xs">Allowed Paths (comma-separated)</Label>
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
              className="text-sm h-8 mt-1"
            />
          </div>
        </div>
      )}
    </div>
  )
}
