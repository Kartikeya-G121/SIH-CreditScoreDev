"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Step1Props {
  onNext: (applicationId: number) => void
}

export function Step1ApplicationDetails({ onNext }: Step1Props) {
  const [loading, setLoading] = useState(false)
  const [schemes, setSchemes] = useState<any[]>([])
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    requestedAmount: "",
    purpose: "",
    schemeId: searchParams.get("schemeId") || "",
  })

  useEffect(() => {
    // Fetch schemes
    fetch("/api/v1/schemes")
      .then((res) => res.json())
      .then((data) => {
        console.log("Scheme API Response:", data);
        if (data.success) {
          setSchemes(data.data)
        } else {
          console.error("Scheme API failed:", data.message);
        }
      })
      .catch((err) => console.error("Failed to fetch schemes", err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedAmount: parseFloat(formData.requestedAmount),
          purpose: formData.purpose,
          schemeId: formData.schemeId ? parseInt(formData.schemeId) : null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({ title: "Draft Created", description: "Application draft saved successfully." })
        onNext(data.data.applicationId)
      } else {
        toast({ title: "Error", description: data.message || "Failed to create application", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Loan Details</h2>
        
        <div className="grid gap-2">
          <Label htmlFor="scheme">Select Scheme (Optional)</Label>
          <Select
            value={formData.schemeId}
            onValueChange={(val) => setFormData({ ...formData, schemeId: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a scheme" />
            </SelectTrigger>
            <SelectContent>
              {schemes.map((scheme) => (
                <SelectItem key={scheme.schemeId} value={scheme.schemeId.toString()}>
                  {scheme.schemeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="amount">Requested Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="e.g. 50000"
            required
            value={formData.requestedAmount}
            onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            placeholder="Describe why you need this loan..."
            required
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Next: Beneficiary Profile
        </Button>
      </div>
    </form>
  )
}
