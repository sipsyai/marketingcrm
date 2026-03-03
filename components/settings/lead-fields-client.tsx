"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Search,
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  AlertCircle,
  User as UserIcon,
  Briefcase,
  Save,
} from "lucide-react"
import { FieldFormDialog } from "@/components/settings/field-form-dialog"
import { DeleteFieldDialog } from "@/components/settings/delete-field-dialog"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type LeadField = {
  id: number
  name: string
  label: string
  type: string
  is_required: boolean
  is_active: boolean
  is_system_field: boolean
  sort_order: number
  placeholder: string | null
  help_text: string | null
  default_value: string | null
  lead_field_options?: Array<{
    id: number
    value: string
    label: string
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

function SortableSectionCard({ section, onToggleVisibility, onToggleDefault }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "user":
        return <UserIcon className="w-4 h-4 text-white" />
      case "briefcase":
        return <Briefcase className="w-4 h-4 text-white" />
      case "document":
        return (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case "layout":
        return (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        )
      default:
        return <AlertCircle className="w-4 h-4 text-white" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        <div className={`w-8 h-8 rounded ${section.gradient} flex items-center justify-center flex-shrink-0`}>
          {getIcon(section.icon)}
        </div>

        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900">{section.name}</span>
          <div className="text-xs text-gray-500 mt-0.5">
            {section.is_default_open ? "Default: Open" : "Default: Closed"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Visible</span>
            <Switch
              checked={section.is_visible}
              onCheckedChange={() => onToggleVisibility(section.id)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Open</span>
            <Switch
              checked={section.is_default_open}
              onCheckedChange={() => onToggleDefault(section.id)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableFieldCard({ field, onEdit, onDelete, onToggle }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeColors: Record<string, string> = {
    text: "bg-blue-100 text-blue-800",
    email: "bg-purple-100 text-purple-800",
    phone: "bg-green-100 text-green-800",
    url: "bg-cyan-100 text-cyan-800",
    textarea: "bg-indigo-100 text-indigo-800",
    number: "bg-orange-100 text-orange-800",
    date: "bg-pink-100 text-pink-800",
    select: "bg-emerald-100 text-emerald-800",
    multiselect: "bg-teal-100 text-teal-800",
    multiselect_dropdown: "bg-violet-100 text-violet-800",
    checkbox: "bg-amber-100 text-amber-800",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-gray-900">{field.label}</h3>
            <Badge
              variant="secondary"
              className={`${typeColors[field.type] || "bg-gray-100 text-gray-800"} text-xs`}
            >
              {field.type}
            </Badge>
            {field.is_required && (
              <Badge variant="outline" className="text-xs">
                Required
              </Badge>
            )}
            {field.is_system_field && (
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                <AlertCircle className="w-3 h-3 mr-1" />
                System
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-2">Field name: {field.name}</p>

          {field.help_text && (
            <p className="text-xs text-gray-400 mb-2">{field.help_text}</p>
          )}

          {field.lead_field_options && field.lead_field_options.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {field.lead_field_options.slice(0, 5).map((opt: any) => (
                <Badge key={opt.id} variant="outline" className="text-xs">
                  {opt.label}
                </Badge>
              ))}
              {field.lead_field_options.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{field.lead_field_options.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Switch
            checked={field.is_active}
            onCheckedChange={() => onToggle(field.id)}
          />

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(field)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="w-4 h-4" />
            </Button>

            {!field.is_system_field && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(field)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LeadFieldsClient({ fields: initialFields }: { fields: LeadField[] }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [fields, setFields] = useState<LeadField[]>(initialFields)
  const [formSections, setFormSections] = useState<FormSection[]>([])
  const [isSavingSections, setIsSavingSections] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editField, setEditField] = useState<LeadField | null>(null)
  const [deleteField, setDeleteField] = useState<LeadField | null>(null)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update fields when initialFields changes (after router.refresh())
  useEffect(() => {
    setFields(initialFields)
  }, [initialFields])

  // Fetch form sections
  useEffect(() => {
    fetch("/api/settings/lead-form-sections")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch form sections")
        return res.json()
      })
      .then((data) => setFormSections(data))
      .catch((err) => {
        console.error("Error fetching form sections:", err)
        toast.error("Failed to load form sections")
      })
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      const newFields = arrayMove(fields, oldIndex, newIndex)
      setFields(newFields)

      // Update backend
      try {
        const res = await fetch("/api/settings/lead-fields/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldIds: newFields.map((f) => f.id) }),
        })
        if (!res.ok) throw new Error("Failed to reorder fields")
        router.refresh()
      } catch (error) {
        console.error("Failed to reorder fields:", error)
        toast.error("Failed to reorder fields")
        router.refresh()
      }
    }
  }

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = formSections.findIndex((s) => s.id === active.id)
      const newIndex = formSections.findIndex((s) => s.id === over.id)

      const newSections = arrayMove(formSections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          sort_order: index + 1,
        })
      )
      setFormSections(newSections)
    }
  }

  const handleToggleSectionVisibility = (sectionId: number) => {
    setFormSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s
      )
    )
  }

  const handleToggleSectionDefault = (sectionId: number) => {
    setFormSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, is_default_open: !s.is_default_open } : s
      )
    )
  }

  const handleSaveSections = async () => {
    setIsSavingSections(true)
    try {
      const res = await fetch("/api/settings/lead-form-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSections),
      })
      if (!res.ok) throw new Error("Failed to save sections")
      toast.success("Sections saved successfully")
      router.refresh()
    } catch (error) {
      console.error("Failed to save sections:", error)
      toast.error("Failed to save sections")
    } finally {
      setIsSavingSections(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`/api/settings/lead-fields/${id}/toggle`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to toggle field")
      router.refresh()
    } catch (error) {
      console.error("Failed to toggle field:", error)
      toast.error("Failed to toggle field status")
      router.refresh()
    }
  }

  const filteredFields = fields.filter(
    (field) =>
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: fields.length,
    active: fields.filter((f) => f.is_active).length,
    custom: fields.filter((f) => !f.is_system_field).length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 mb-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Lead Properties</h1>
        <p className="text-indigo-100">
          Manage custom fields and properties for your leads
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Properties</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.custom}</div>
          <div className="text-sm text-gray-500">Custom Fields</div>
        </div>
      </div>

      {/* View Configuration Card */}
      <Card className="border-0 shadow-sm mb-6 bg-gradient-to-r from-orange-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Form View Configuration</h3>
              <p className="text-sm text-gray-600">Drag to reorder, toggle visibility and default state</p>
            </div>
            <Button
              onClick={handleSaveSections}
              disabled={isSavingSections || !mounted}
              className="bg-[#FF7A59] hover:bg-[#FF6B47] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingSections ? "Saving..." : "Save Configuration"}
            </Button>
          </div>

          {!mounted || !Array.isArray(formSections) || formSections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Loading sections...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={formSections.filter((s) => ['contact_information', 'lead_details'].includes(s.section_key)).map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {formSections
                    .filter((s) => ['contact_information', 'lead_details'].includes(s.section_key))
                    .map((section) => (
                    <SortableSectionCard
                      key={section.id}
                      section={section}
                      onToggleVisibility={handleToggleSectionVisibility}
                      onToggleDefault={handleToggleSectionDefault}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>These settings control how sections appear in lead create, edit, and view pages. Drag to reorder, use toggles to show/hide sections and set their default open/closed state.</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create property
        </Button>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto">
        {!mounted ? (
          <div className="text-center py-12 text-gray-500">
            Loading properties...
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredFields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {filteredFields.map((field) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      onEdit={setEditField}
                      onDelete={setDeleteField}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {filteredFields.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No properties found matching your search.
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <FieldFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          router.refresh()
        }}
      />

      <FieldFormDialog
        open={!!editField}
        onOpenChange={(open) => !open && setEditField(null)}
        field={editField}
        onSuccess={() => {
          setEditField(null)
          router.refresh()
        }}
      />

      <DeleteFieldDialog
        open={!!deleteField}
        onOpenChange={(open) => !open && setDeleteField(null)}
        field={deleteField}
        onSuccess={() => {
          setDeleteField(null)
          router.refresh()
        }}
      />
    </div>
  )
}
