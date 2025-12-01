"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Step2Props {
  onNext: () => void
  onBack: () => void
}

export function Step2BeneficiaryReview({ onNext, onBack }: Step2Props) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/beneficiaries/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.data)
        }
      })
      .catch((err) => console.error("Failed to fetch profile", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Profile not found. Please complete your profile first.</p>
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Review Your Profile</h2>
        <p className="text-sm text-muted-foreground">Please ensure your details are correct before proceeding.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-lg">
          <div>
            <Label className="text-muted-foreground">Full Name</Label>
            <p className="font-medium">{profile.fullName}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Phone Number</Label>
            <p className="font-medium">{profile.user?.phoneNumber || "N/A"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Caste Category</Label>
            <p className="font-medium">{profile.casteCategory}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Annual Income</Label>
            <p className="font-medium">₹{profile.verifiedAnnualIncome}</p>
          </div>
          <div className="md:col-span-2">
            <Label className="text-muted-foreground">Address</Label>
            <p className="font-medium">
              {profile.addressLine}, {profile.district}, {profile.state} - {profile.pincode}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="link" className="text-primary p-0 h-auto" onClick={() => window.open('/dashboard?tab=profile', '_blank')}>
            Incorrect details? Update your profile here
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next: Consumption History</Button>
      </div>
    </div>
  )
}
