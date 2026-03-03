"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, X } from "lucide-react"

const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required")
    .regex(/^[a-z_][a-z0-9_]*$/, "Must be lowercase letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  type: z.enum([
    "text",
    "email",
    "phone",
    "url",
    "textarea",
    "number",
    "date",
    "select",
    "multiselect",
    "multiselect_dropdown",
  ]),
  is_required: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  placeholder: z.string().optional(),
  help_text: z.string().optional(),
  default_value: z.string().optional(),
})

type FieldFormValues = z.infer<typeof fieldSchema>

type Option = {
  value: string
  label: string
}

type LeadField = {
  id: number
  name: string
  label: string
  type: string
  is_required?: boolean
  is_active?: boolean
  placeholder: string | null
  help_text: string | null
  default_value: string | null
  lead_field_options?: Array<{
    id: number
    value: string
    label: string
  }>
}

interface FieldFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field?: LeadField | null
  onSuccess: () => void
  fieldType?: "lead" | "investor"
}

const FIELD_TYPES = [
  { value: "text", label: "Single-line text" },
  { value: "textarea", label: "Multi-line text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "url", label: "URL" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown select" },
  { value: "multiselect", label: "Multiple checkboxes" },
  { value: "multiselect_dropdown", label: "Dropdown multiselect" },
]

export function FieldFormDialog({
  open,
  onOpenChange,
  field,
  onSuccess,
  fieldType = "lead",
}: FieldFormDialogProps) {
  const [options, setOptions] = useState<Option[]>([])
  const [newOption, setNewOption] = useState({ value: "", label: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: "",
      label: "",
      type: "text" as const,
      placeholder: "",
      help_text: "",
      default_value: "",
    },
  })

  const watchedType = form.watch("type")
  const isSelectType = watchedType === "select" || watchedType === "multiselect" || watchedType === "multiselect_dropdown"

  useEffect(() => {
    if (field) {
      form.reset({
        name: field.name,
        label: field.label,
        type: field.type as any,
        is_required: field.is_required,
        is_active: field.is_active,
        placeholder: field.placeholder || "",
        help_text: field.help_text || "",
        default_value: field.default_value || "",
      })

      // Use correct field options based on fieldType
      const fieldOptions = fieldType === "investor"
        ? (field as any).investor_field_options
        : field.lead_field_options;

      if (fieldOptions) {
        setOptions(
          fieldOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.label,
          }))
        )
      }
    } else {
      form.reset({
        name: "",
        label: "",
        type: "text",
        is_required: false,
        is_active: true,
        placeholder: "",
        help_text: "",
        default_value: "",
      })
      setOptions([])
    }
  }, [field, form, fieldType])

  const addOption = () => {
    if (newOption.label && newOption.value) {
      setOptions([...options, newOption])
      setNewOption({ value: "", label: "" })
    }
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: FieldFormValues) => {
    try {
      setIsSubmitting(true)

      const payload = {
        ...values,
        options: isSelectType ? options : null,
      }

      const endpoint = fieldType === "investor" ? "investor-fields" : "lead-fields"
      const url = field
        ? `/api/settings/${endpoint}/${field.id}`
        : `/api/settings/${endpoint}`

      const method = field ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error Response:", errorData)
        throw new Error(errorData.details || errorData.error || "Failed to save field")
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error saving field:", error)
      toast.error(error.message || "Failed to save field")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {field ? "Edit Property" : "Create Property"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Label */}
              <FormField
                control={form.control}
                name="label"
                render={({ field: labelField }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Company Size"
                        {...labelField}
                        onChange={(e) => {
                          const label = e.target.value
                          labelField.onChange(label)

                          // Convert to lowercase and remove Turkish/special characters for field name
                          const fieldName = label
                            .toLowerCase()
                            .replace(/ğ/g, 'g')
                            .replace(/ü/g, 'u')
                            .replace(/ş/g, 's')
                            .replace(/ı/g, 'i')
                            .replace(/ö/g, 'o')
                            .replace(/ç/g, 'c')
                            .replace(/[^a-z0-9]/g, '_')
                            .replace(/_+/g, '_')
                            .replace(/^_|_$/g, '')

                          form.setValue('name', fieldName)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      The label shown in forms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., company_size"
                        {...field}
                        disabled
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormDescription>
                      Internal field name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Options for select types */}
            {isSelectType && (
              <div className="space-y-4">
                <FormLabel>Options</FormLabel>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option.label}
                        disabled
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Label (e.g., Small)"
                      value={newOption.label}
                      onChange={(e) => {
                        const label = e.target.value
                        // Convert to lowercase and remove Turkish/special characters for value
                        const value = label
                          .toLowerCase()
                          .replace(/ğ/g, 'g')
                          .replace(/ü/g, 'u')
                          .replace(/ş/g, 's')
                          .replace(/ı/g, 'i')
                          .replace(/ö/g, 'o')
                          .replace(/ç/g, 'c')
                          .replace(/[^a-z0-9]/g, '_')
                          .replace(/_+/g, '_')
                          .replace(/^_|_$/g, '')

                        setNewOption({ value, label })
                      }}
                    />
                    <Input
                      placeholder="Value (e.g., small)"
                      value={newOption.value}
                      disabled
                      className="bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      disabled={!newOption.label}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder */}
            <FormField
              control={form.control}
              name="placeholder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placeholder</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Enter company size..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Help Text */}
            <FormField
              control={form.control}
              name="help_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Help Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about this field..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Value */}
            <FormField
              control={form.control}
              name="default_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Value</FormLabel>
                  <FormControl>
                    <Input placeholder="Default value..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Switches */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Required</FormLabel>
                      <FormDescription>
                        Make this field mandatory
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Show in forms
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {isSubmitting ? "Saving..." : field ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
