"use client"

/**
 * AI Coder — Skill Selector
 *
 * Dropdown to select which skill/capability to use for the current request.
 * Skills define the scope and constraints for the AI agent.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Palette,
  TextAa,
  PlusCircle,
  Bug,
} from "@phosphor-icons/react"
import type { AICoderSkill } from "@/lib/ai-coder/types"

// Map icon string names from config to Phosphor icon components
const skillIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette,
  TextAa,
  PlusCircle,
  Bug,
}

interface SkillSelectorProps {
  skills: AICoderSkill[]
  selectedSkillId: string
  onSkillChange: (skillId: string) => void
  disabled?: boolean
}

export function SkillSelector({
  skills,
  selectedSkillId,
  onSkillChange,
  disabled = false,
}: SkillSelectorProps) {
  return (
    <Select value={selectedSkillId} onValueChange={onSkillChange} disabled={disabled}>
      <SelectTrigger className="w-[180px] h-8 text-xs border-border/60">
        <SelectValue placeholder="Select skill" />
      </SelectTrigger>
      <SelectContent>
        {skills.map((skill) => {
          const Icon = skillIconMap[skill.icon]
          return (
            <SelectItem key={skill.id} value={skill.id}>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                <span>{skill.name}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
