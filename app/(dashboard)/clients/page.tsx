import { ClientsContent } from "@/components/clients/ClientsContent"
import { RoleGuard } from "@/components/auth/RoleGuard"

export default function ClientsPage() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <ClientsContent />
    </RoleGuard>
  )
}
