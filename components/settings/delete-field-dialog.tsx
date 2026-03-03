"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

type LeadField = {
  id: number
  name: string
  label: string
  is_system_field: boolean
}

interface DeleteFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: LeadField | null
  onSuccess: () => void
  fieldType?: "lead" | "investor"
}

export function DeleteFieldDialog({
  open,
  onOpenChange,
  field,
  onSuccess,
  fieldType = "lead",
}: DeleteFieldDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!field) return

    try {
      setIsDeleting(true)
      const endpoint = fieldType === "investor" ? "investor-fields" : "lead-fields"
      const response = await fetch(`/api/settings/${endpoint}/${field.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete field")
      }

      toast.success("Field deleted successfully")
      onSuccess()
    } catch (error) {
      console.error("Error deleting field:", error)
      toast.error("Failed to delete field")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!field) return null

  if (field.is_system_field) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot Delete System Field</AlertDialogTitle>
            <AlertDialogDescription>
              The field &quot;{field.label}&quot; is a system field and cannot be deleted.
              System fields are required for the CRM to function properly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Property</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{field.label}&quot;? This action cannot be
            undone and all data stored in this field will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
