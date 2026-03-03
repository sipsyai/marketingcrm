"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Shield } from "lucide-react"
import { RoleFormDialog } from "./role-form-dialog"
import { DeleteRoleDialog } from "./delete-role-dialog"
import { PermissionsStructure } from "@/lib/permissions"

interface Role {
  id: number
  name: string
  slug: string
  description?: string | null
  permissions: PermissionsStructure
  is_system: boolean
  status: "active" | "inactive"
  userCount: number
}

interface RolesClientProps {
  roles: Role[]
}

export function RolesClient({ roles: initialRoles }: RolesClientProps) {
  const [roles, setRoles] = useState(initialRoles)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null)
  const [deleteRoleName, setDeleteRoleName] = useState("")

  const refreshRoles = async () => {
    try {
      const response = await fetch("/api/settings/roles")
      if (!response.ok) throw new Error("Failed to fetch roles")
      const data = await response.json()
      setRoles(data)
    } catch (error) {
      console.error("Failed to refresh roles:", error)
      toast.error("Failed to refresh roles list")
    }
  }

  const handleCreate = () => {
    setSelectedRole(null)
    setFormOpen(true)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setFormOpen(true)
  }

  const handleDelete = (role: Role) => {
    setDeleteRoleId(role.id)
    setDeleteRoleName(role.name)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage user roles and their access permissions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {role.is_system && (
                        <Shield className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="font-medium">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-muted-foreground truncate">
                      {role.description || "No description"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.userCount} users</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.status === "active" ? "default" : "secondary"}>
                      {role.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(role)}
                        disabled={role.is_system || role.userCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={selectedRole}
        onSuccess={refreshRoles}
      />

      <DeleteRoleDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        roleId={deleteRoleId}
        roleName={deleteRoleName}
        onSuccess={refreshRoles}
      />
    </div>
  )
}
