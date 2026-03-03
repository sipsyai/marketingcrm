"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { getActivityIconComponent } from "@/lib/activity-icons"

const activityFormSchema = z.object({
  type: z.string().min(1, "Please select an activity type"),
  subject: z.string().optional(),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters",
  }),
  lead_status: z.string().optional(),
})

type ActivityFormValues = z.infer<typeof activityFormSchema>

interface ActivityType {
  id: number
  name: string
  label: string
  icon: string | null
  color: string | null
  is_active: boolean
  sort_order: number
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
]

interface AddActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId?: number
  investorId?: number
  onSuccess?: () => void
}

export function AddActivityDialog({
  open,
  onOpenChange,
  leadId,
  investorId,
  onSuccess,
}: AddActivityDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: "",
      subject: "",
      description: "",
      lead_status: "",
    },
  })

  // Fetch activity types
  useEffect(() => {
    async function fetchActivityTypes() {
      try {
        const response = await fetch("/api/settings/activity-types")
        if (response.ok) {
          const types = await response.json()
          const activeTypes = types.filter((t: ActivityType) => t.is_active)
          setActivityTypes(activeTypes)
          // Set first type as default
          if (activeTypes.length > 0 && !form.getValues("type")) {
            form.setValue("type", activeTypes[0].name)
          }
        }
      } catch (error) {
        console.error("Failed to fetch activity types:", error)
        toast.error("Failed to load activity types")
      } finally {
        setIsLoadingTypes(false)
      }
    }

    if (open) {
      fetchActivityTypes()
    }
  }, [open, form])

  async function onSubmit(data: ActivityFormValues) {
    setIsSubmitting(true)

    try {
      // Find the selected activity type to get its ID
      const selectedType = activityTypes.find(t => t.name === data.type)

      const response = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          activity_type_id: selectedType?.id,
          lead_id: leadId,
          investor_id: investorId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to create activity")
      }

      const result = await response.json()

      if (result.success) {
        toast.success("Activity created successfully")
        form.reset()
        onOpenChange(false)
        router.refresh()
        if (onSuccess) onSuccess()
      } else {
        toast.error(result.message || "Failed to create activity")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
          <DialogDescription>
            Record a new activity for this {leadId ? "lead" : "investor"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activityTypes.map((type) => {
                        const IconComponent = getActivityIconComponent(type.icon)
                        return (
                          <SelectItem key={type.id} value={type.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="flex items-center justify-center w-8 h-8 rounded"
                                style={{ backgroundColor: type.color ? `${type.color}20` : '#f3f4f6' }}
                              >
                                <IconComponent
                                  className="h-4 w-4"
                                  style={{ color: type.color || '#6b7280' }}
                                />
                              </div>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Activity subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the activity..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {leadId && (
              <FormField
                control={form.control}
                name="lead_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Status (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingTypes}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Activity
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
