"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash, Save, Phone, Mail, Calendar, MessageSquare, Users, FileText, CheckCircle, Clock, Bell, Zap, GripVertical } from "lucide-react"
import { toast } from "sonner"
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

interface ActivityType {
  id: number
  name: string
  label: string
  icon: string | null
  color: string | null
  is_active: boolean
  sort_order: number
}

interface ActivityTypesSettingsProps {
  activityTypes: ActivityType[]
}

const COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blue", name: "blue" },
  { value: "#8b5cf6", label: "Purple", name: "purple" },
  { value: "#10b981", label: "Green", name: "green" },
  { value: "#f59e0b", label: "Orange", name: "orange" },
  { value: "#ef4444", label: "Red", name: "red" },
  { value: "#ec4899", label: "Pink", name: "pink" },
  { value: "#06b6d4", label: "Cyan", name: "cyan" },
  { value: "#6366f1", label: "Indigo", name: "indigo" },
  { value: "#84cc16", label: "Lime", name: "lime" },
  { value: "#64748b", label: "Slate", name: "slate" },
]

const ICON_OPTIONS = [
  { value: "Phone", label: "Phone" },
  { value: "Mail", label: "Mail" },
  { value: "Calendar", label: "Calendar" },
  { value: "MessageSquare", label: "Message Square" },
  { value: "Users", label: "Users" },
  { value: "FileText", label: "File Text" },
  { value: "CheckCircle", label: "Check Circle" },
  { value: "Clock", label: "Clock" },
  { value: "Bell", label: "Bell" },
  { value: "Zap", label: "Zap" },
]

const iconComponents: Record<string, any> = {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  CheckCircle,
  Clock,
  Bell,
  Zap,
}

const statusConfig: Record<string, { label: string }> = {
  new: { label: "New" },
  contacted: { label: "Contacted" },
  qualified: { label: "Qualified" },
  proposal: { label: "Proposal" },
  negotiation: { label: "Negotiation" },
  won: { label: "Won" },
  lost: { label: "Lost" },
}

const priorityConfig: Record<string, { label: string }> = {
  low: { label: "Low" },
  medium: { label: "Medium" },
  high: { label: "High" },
  urgent: { label: "Urgent" },
}

interface SortableRowProps {
  type: ActivityType
  onEdit: (type: ActivityType) => void
  onDelete: (id: number) => void
}

function SortableRow({ type, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: type.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-gray-50">
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </TableCell>
      <TableCell className="font-mono">{type.name}</TableCell>
      <TableCell>{type.label}</TableCell>
      <TableCell>{type.icon || "-"}</TableCell>
      <TableCell>
        {type.color ? (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: type.color }}
            />
            <span>
              {COLOR_OPTIONS.find((c) => c.value === type.color)?.label ||
                type.color}
            </span>
          </div>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        <Badge variant={type.is_active ? "default" : "secondary"}>
          {type.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(type)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(type.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ActivityTypesSettings({ activityTypes: initialTypes }: ActivityTypesSettingsProps) {
  const router = useRouter()
  const [activityTypes, setActivityTypes] = useState(initialTypes.sort((a, b) => a.sort_order - b.sort_order))
  const [editingType, setEditingType] = useState<ActivityType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    icon: "",
    color: "",
    is_active: true,
    sort_order: 0,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleEdit = (type: ActivityType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      label: type.label,
      icon: type.icon || "",
      color: type.color || "",
      is_active: type.is_active,
      sort_order: type.sort_order,
    })
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingType(null)
    setFormData({
      name: "",
      label: "",
      icon: "",
      color: "",
      is_active: true,
      sort_order: activityTypes.length,
    })
    setIsDialogOpen(true)
  }

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const url = editingType
        ? `/api/settings/activity-types/${editingType.id}`
        : `/api/settings/activity-types`

      const method = editingType ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save activity type")
      }

      const savedType = await response.json()

      if (editingType) {
        setActivityTypes(
          activityTypes.map((type) =>
            type.id === editingType.id ? savedType : type
          )
        )
      } else {
        setActivityTypes([...activityTypes, savedType])
      }

      toast.success(editingType ? "Activity type updated" : "Activity type created")
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Failed to save activity type")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity type?")) return

    try {
      const response = await fetch(`/api/settings/activity-types/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete activity type")
      }

      toast.success("Activity type deleted")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete activity type")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = activityTypes.findIndex((type) => type.id === active.id)
    const newIndex = activityTypes.findIndex((type) => type.id === over.id)

    const newOrder = arrayMove(activityTypes, oldIndex, newIndex)
    setActivityTypes(newOrder)

    // Update sort_order on server
    try {
      const updates = newOrder.map((type, index) => ({
        id: type.id,
        sort_order: index,
      }))

      const response = await fetch("/api/settings/activity-types/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        throw new Error("Failed to update sort order")
      }

      toast.success("Sort order updated")
    } catch (error) {
      toast.error("Failed to update sort order")
      // Revert on error
      router.refresh()
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity Types</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity Type
          </Button>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={activityTypes.map((type) => type.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {activityTypes.map((type) => (
                    <SortableRow
                      key={type.id}
                      type={type}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Activity Type" : "Add Activity Type"}
            </DialogTitle>
            <DialogDescription>
              Configure activity type settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (display name)</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => {
                  const label = e.target.value
                  const name = label.toLowerCase().replace(/\s+/g, "_")
                  setFormData({ ...formData, label, name })
                }}
                placeholder="e.g., Call"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (auto-generated)</Label>
              <Input
                id="name"
                value={formData.name}
                placeholder="e.g., call"
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger id="icon">
                  <SelectValue placeholder="Select an icon">
                    {formData.icon && iconComponents[formData.icon] ? (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = iconComponents[formData.icon]
                          return <IconComponent className="h-4 w-4" />
                        })()}
                        <span>{ICON_OPTIONS.find((i) => i.value === formData.icon)?.label || formData.icon}</span>
                      </div>
                    ) : (
                      "Select an icon"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((icon) => {
                    const IconComponent = iconComponents[icon.value]
                    return (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData({ ...formData, color: value })}
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select a color">
                    {formData.color && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: formData.color }}
                        />
                        <span>
                          {COLOR_OPTIONS.find((c) => c.value === formData.color)?.label ||
                            formData.color}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.value }}
                        />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
