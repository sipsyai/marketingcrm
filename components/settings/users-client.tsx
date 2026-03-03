"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react"
import { UserFormDialog } from "./user-form-dialog"
import { PasswordResetDialog } from "./password-reset-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"

interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  role_id?: number | null
  status: "active" | "inactive"
  roles?: {
    id: number
    name: string
  } | null
}

interface Role {
  id: number
  name: string
  slug: string
}

interface UsersClientProps {
  users: User[]
  roles: Role[]
}

export function UsersClient({ users: initialUsers, roles }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [formOpen, setFormOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [deleteUserName, setDeleteUserName] = useState("")
  const [resetUserId, setResetUserId] = useState<number | null>(null)
  const [resetUserName, setResetUserName] = useState("")

  const refreshUsers = async () => {
    try {
      const response = await fetch("/api/settings/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Failed to refresh users:", error)
      toast.error("Failed to refresh users list")
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setFormOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setFormOpen(true)
  }

  const handleDelete = (user: User) => {
    setDeleteUserId(user.id)
    setDeleteUserName(user.name)
    setDeleteOpen(true)
  }

  const handleResetPassword = (user: User) => {
    setResetUserId(user.id)
    setResetUserName(user.name)
    setPasswordOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.phone || "-"}
                  </TableCell>
                  <TableCell>
                    {user.roles ? (
                      <Badge variant="outline">{user.roles.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No role</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        title="Edit user"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(user)}
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={user.email === "admin@example.com"}
                        title="Delete user"
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

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={selectedUser}
        roles={roles}
        onSuccess={refreshUsers}
      />

      <PasswordResetDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        userId={resetUserId}
        userName={resetUserName}
        onSuccess={refreshUsers}
      />

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userId={deleteUserId}
        userName={deleteUserName}
        onSuccess={refreshUsers}
      />
    </div>
  )
}
