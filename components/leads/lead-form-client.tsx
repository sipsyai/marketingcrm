"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, User as UserIcon, ChevronDown, ChevronUp, TrendingUp, CheckCircle2 } from "lucide-react"
import { LeadDynamicField } from "@/components/fields/lead-dynamic-field"
import { LeadFormProgress } from "./lead-form-progress"
import { LeadEditHero } from "./lead-edit-hero"
import { cn } from "@/lib/utils"

// Schema for new structure (only contact info, rest comes from dynamic fields)
const leadSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
})

type LeadFormValues = z.infer<typeof leadSchema> & {
  customFields?: Record<string, any>
}

type CustomField = {
  id: number
  name: string
  label: string
  type: string
  is_required: boolean
  placeholder: string | null
  help_text: string | null
  default_value: string | null
  section_key: string | null
  lead_field_options?: Array<{
    id: number
    value: string
    label: string
  }>
}

type Lead = {
  id: number
  full_name: string
  email: string
  phone: string
  source: string
  status: string
  priority: string | null
  notes_text: string | null
  created_at: Date | null
  updated_at: Date | null
  lead_field_values?: Array<{
    lead_field_id: number
    value: string | null
  }>
}

type FormSection = {
  id: number
  section_key: string
  name: string
  is_visible: boolean
  is_default_open: boolean
  sort_order: number
  icon: string
  gradient: string
}

interface LeadFormClientProps {
  lead?: Lead
  customFields: CustomField[]
}

interface CollapsibleSectionProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  gradient: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({
  title,
  subtitle,
  icon,
  gradient,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <div className={cn(
          "p-6 border-b border-gray-200 transition-colors",
          gradient
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </div>
      </button>

      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <CardContent className="px-6 pb-6 pt-0 space-y-4">
          {children}
        </CardContent>
      </div>
    </Card>
  )
}

export function LeadFormClient({
  lead,
  customFields,
}: LeadFormClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSections, setFormSections] = useState<FormSection[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>(
    () => {
      if (!lead) return {}

      // Start with values from lead_field_values
      const values = lead.lead_field_values?.reduce(
        (acc, fv) => {
          // Find the field to check its type
          const field = customFields.find(f => f.id === fv.lead_field_id)
          let parsedValue: any = fv.value

          // Parse JSON for multiselect fields
          if (field && (field.type === 'multiselect' || field.type === 'multiselect_dropdown')) {
            try {
              parsedValue = fv.value ? JSON.parse(fv.value) : []
            } catch (e) {
              console.error('Error parsing field value:', e)
              parsedValue = []
            }
          }

          return {
            ...acc,
            [fv.lead_field_id]: parsedValue,
          }
        },
        {} as Record<string, any>
      ) || {}

      // Add system fields from leads table if not in lead_field_values
      customFields.forEach(field => {
        // Only set if value doesn't already exist in values
        if (!values[field.id]) {
          if (field.name === 'priority' && lead.priority) {
            values[field.id] = lead.priority
          } else if (field.name === 'status' && lead.status) {
            values[field.id] = lead.status
          } else if (field.name === 'source' && lead.source) {
            values[field.id] = lead.source
          }
        }
      })

      return values
    }
  )

  // Fetch form sections configuration
  useEffect(() => {
    fetch("/api/settings/lead-form-sections")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch form sections")
        return res.json()
      })
      .then((data) => setFormSections(data))
      .catch((err) => console.error("Error fetching form sections:", err))
  }, [])

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead
      ? {
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
        }
      : {
          full_name: "",
          email: "",
          phone: "",
        },
  })

  // Calculate form completion
  const formValues = form.watch()
  const completedFields = useMemo(() => {
    const requiredFields = ["full_name", "email", "phone"]

    let completed = 0
    const total = requiredFields.length + customFields.length

    // Count required contact fields
    requiredFields.forEach(field => {
      if (formValues[field as keyof typeof formValues]) completed++
    })

    // Count custom fields
    Object.keys(customFieldValues).forEach(key => {
      if (customFieldValues[key]) completed++
    })

    return { completed, total }
  }, [formValues, customFieldValues, customFields.length])

  const onSubmit = async (values: LeadFormValues) => {
    try {
      setIsSubmitting(true)

      const payload = {
        ...values,
        customFields: customFieldValues,
      }

      const url = lead ? `/api/leads/${lead.id}` : "/api/leads"
      const method = lead ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("API Error Response:", error)
        throw new Error(error.details || error.error || "Failed to save lead")
      }

      toast.success(lead ? "Lead updated successfully" : "Lead created successfully")
      router.push("/leads")
      router.refresh()
    } catch (error: any) {
      console.error("Error saving lead:", error)
      toast.error(error.message || "Failed to save lead")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/leads")
  }


  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Modern Hero Header (only for edit mode) */}
          {lead && (
            <LeadEditHero
              lead={lead}
              isSubmitting={isSubmitting}
              onSave={form.handleSubmit(onSubmit)}
              onCancel={handleCancel}
            />
          )}

          {/* Header for new lead */}
          {!lead && (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
                <p className="text-gray-600 mt-1">Add a new lead to your CRM</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Lead
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            {/* Main Form Column */}
            <div className="col-span-8 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Contact Information Section */}
                  <CollapsibleSection
                    title="Contact Information"
                    subtitle="Required contact details"
                    icon={<UserIcon className="w-5 h-5 text-blue-600" />}
                    gradient="bg-gradient-to-r from-blue-50 to-sky-50"
                  >
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Full Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              {...field}
                              className="border-gray-300 focus:border-[#FF7A59] focus:ring-[#FF7A59]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john.doe@example.com"
                              {...field}
                              className="border-gray-300 focus:border-[#FF7A59] focus:ring-[#FF7A59]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Phone <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+90 555 123 4567"
                              {...field}
                              className="border-gray-300 focus:border-[#FF7A59] focus:ring-[#FF7A59]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleSection>

                  {/* Lead Details Section (all fields from lead_fields table) */}
                  <CollapsibleSection
                    title="Lead Details"
                    subtitle="Status, priority and additional information"
                    icon={
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                    gradient="bg-gradient-to-r from-blue-50 to-sky-50"
                  >
                    <div className="space-y-4">
                      {/* All Dynamic Fields from lead_fields */}
                      {customFields.map((field) => (
                          <LeadDynamicField
                            key={field.id}
                            field={field}
                            value={customFieldValues[field.id]}
                            onChange={(value) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [field.id]: value,
                              })
                            }
                          />
                        ))}
                    </div>
                  </CollapsibleSection>
                </form>
              </Form>
            </div>

            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Progress Card */}
              <Card className="border-gray-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Form Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <LeadFormProgress
                    completedFields={completedFields.completed}
                    totalFields={completedFields.total}
                  />
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border-gray-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>All contact fields are required and must be unique</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Select country code before entering phone number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Use notes to capture important context</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
