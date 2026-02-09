import { Suspense } from "react"
import { ProjectsContent } from "@/components/projects-content"

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsContent />
    </Suspense>
  )
}
