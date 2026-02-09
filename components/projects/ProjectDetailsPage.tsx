"use client"

import { useCallback, useMemo, useState } from "react"
import { LinkSimple, SquareHalf } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"

import { useProjectDetails } from "@/hooks/useProjectDetails"
import { adaptToLegacyProjectDetails } from "@/lib/adapters/project-details-adapter"
import type { ProjectDetails as LegacyProjectDetails } from "@/lib/data/project-details"
import { Breadcrumbs } from "@/components/projects/Breadcrumbs"
import { ProjectHeader } from "@/components/projects/ProjectHeader"
import { ScopeColumns } from "@/components/projects/ScopeColumns"
import { OutcomesList } from "@/components/projects/OutcomesList"
import { KeyFeaturesColumns } from "@/components/projects/KeyFeaturesColumns"
import { TimelineGantt } from "@/components/projects/TimelineGantt"
import { RightMetaPanel } from "@/components/projects/RightMetaPanel"
import { WorkstreamTab } from "@/components/projects/WorkstreamTab"
import { ProjectEditDialog } from "@/components/projects/ProjectEditDialog"
import { ProjectIntakeBrief } from "@/components/projects/ProjectIntakeBrief"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

type ProjectDetailsPageProps = {
  projectId: string
}

export function ProjectDetailsPage({ projectId }: ProjectDetailsPageProps) {
  const { details, loading, error } = useProjectDetails(projectId)
  const [showMeta, setShowMeta] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Adapt Firebase data to legacy format for child components
  const project: LegacyProjectDetails | null = useMemo(() => {
    if (!details.project) return null

    return adaptToLegacyProjectDetails({
      project: details.project,
      tasks: details.tasks,
      workstreams: details.workstreams,
      files: details.files,
      picUsers: details.picUsers,
      supportUsers: details.supportUsers,
      clientName: details.client?.companyName,
    })
  }, [details])

  const copyLink = useCallback(async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not available")
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied")
    } catch {
      toast.error("Failed to copy link")
    }
  }, [])

  const breadcrumbs = useMemo(
    () => [
      { label: "Projects", href: "/" },
      { label: project?.name ?? "Project Details" },
    ],
    [project?.name]
  )

  const openEditDialog = useCallback(() => {
    setIsEditDialogOpen(true)
  }, [])

  if (loading || !project) {
    return <ProjectDetailsSkeleton />
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 m-2 border border-border rounded-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <div className="hidden sm:block">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" aria-label="Copy link" onClick={copyLink}>
            <LinkSimple className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={!showMeta}
            aria-label={showMeta ? "Collapse meta panel" : "Expand meta panel"}
            className={showMeta ? "bg-muted" : ""}
            onClick={() => setShowMeta((v) => !v)}
          >
            <SquareHalf className="h-4 w-4" weight="duotone" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-background rounded-b-lg min-w-0 border-t overflow-hidden">
        <div
          className={
            "flex-1 grid grid-cols-1 min-w-0 " +
            (showMeta
              ? "lg:grid-cols-[minmax(0,1fr)_300px]"
              : "lg:grid-cols-1")
          }
        >
          {/* Main content column */}
          <div className="min-w-0 overflow-y-auto px-6 pt-4 pb-8 space-y-6">
            <ProjectHeader project={project} onEditProject={openEditDialog} />

            <Tabs defaultValue="overview">
              <TabsList className="w-full gap-4 overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="brief">Brief</TabsTrigger>
                <TabsTrigger value="workstream">Workstream</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="assets">Assets &amp; Files</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-10">
                  <p className="text-sm leading-6 text-muted-foreground">{project.description}</p>
                  <ScopeColumns scope={project.scope} />
                  <OutcomesList outcomes={project.outcomes} />
                  <KeyFeaturesColumns features={project.keyFeatures} />
                  <TimelineGantt tasks={project.timelineTasks} />
                </div>
              </TabsContent>

              <TabsContent value="brief">
                {details.project && (
                  <ProjectIntakeBrief project={details.project} />
                )}
              </TabsContent>

              <TabsContent value="workstream">
                <WorkstreamTab workstreams={project.workstreams} />
              </TabsContent>

              <TabsContent value="tasks">
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  Tasks view is upcoming.
                </div>
              </TabsContent>

              <TabsContent value="notes">
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  Notes are upcoming.
                </div>
              </TabsContent>

              <TabsContent value="assets">
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  Assets &amp; Files section is upcoming.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right meta panel */}
          <AnimatePresence initial={false}>
            {showMeta && (
              <motion.div
                key="meta-panel"
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="hidden lg:block border-l border-border overflow-y-auto px-5 pt-4 pb-8"
              >
                <RightMetaPanel project={project} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Separator className="mt-auto" />

      {details.project && (
        <ProjectEditDialog
          project={details.project}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  )
}

function ProjectDetailsSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-background m-2 border border-border rounded-lg min-w-0">
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] border-t min-w-0">
        <div className="px-6 pt-4 pb-8 space-y-8">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-full max-w-sm" />
            <Skeleton className="mt-3 h-5 w-full max-w-lg" />
            <Skeleton className="mt-5 h-px w-full" />
            <Skeleton className="mt-5 h-16 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>

        <div className="hidden lg:block border-l px-5 pt-4 pb-8 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}
