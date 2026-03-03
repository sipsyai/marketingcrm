"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, TrendingUp } from "lucide-react"

interface PromoteInvestorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: number
  leadName: string
}

export function PromoteInvestorDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
}: PromoteInvestorDialogProps) {
  const router = useRouter()
  const [description, setDescription] = useState("")
  const [isPromoting, setIsPromoting] = useState(false)

  const handlePromote = async () => {
    if (!description || description.trim().length < 3) {
      toast.error("Please provide a description (at least 3 characters)")
      return
    }

    setIsPromoting(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to promote lead")
      }

      toast.success("Lead successfully converted to Investor!")
      onOpenChange(false)
      setDescription("")
      router.push(`/investors/${data.investorId}`)
    } catch (error: any) {
      console.error("Promotion error:", error)
      toast.error(error.message || "Failed to promote lead to investor")
    } finally {
      setIsPromoting(false)
    }
  }

  const handleCancel = () => {
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Promote Lead to Investor
          </DialogTitle>
          <DialogDescription>
            Convert <strong>{leadName}</strong> to an investor record.
          </DialogDescription>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">This will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create a new investor with the lead's information</li>
              <li>Copy matching custom fields</li>
              <li>Create a conversion activity</li>
              <li>Mark the lead as "Won"</li>
            </ul>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Conversion Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter notes about this conversion (e.g., 'Lead expressed strong interest in investment opportunities...')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isPromoting}
            />
            <p className="text-xs text-gray-500">
              These notes will be saved in the conversion activity and investor notes.
            </p>
          </div>

          {description.trim().length > 0 && description.trim().length < 3 && (
            <p className="text-sm text-red-600">
              Description must be at least 3 characters
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPromoting}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={isPromoting || description.trim().length < 3}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPromoting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Promote to Investor
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
