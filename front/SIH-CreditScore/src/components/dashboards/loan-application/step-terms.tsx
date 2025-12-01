"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"

interface StepTermsProps {
  onNext: () => void
  onBack: () => void
}

export function StepTerms({ onNext, onBack }: StepTermsProps) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Terms and Conditions</h2>
        <p className="text-sm text-muted-foreground">
          Please read and accept the terms and conditions to proceed with your loan application.
        </p>
      </div>

      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
        <div className="text-sm space-y-4">
          <p><strong>1. Eligibility:</strong> You must be a citizen of India and above 18 years of age.</p>
          <p><strong>2. Interest Rate:</strong> The interest rate is subject to change based on your credit assessment and market conditions.</p>
          <p><strong>3. Repayment:</strong> You agree to repay the loan amount along with interest in equated monthly installments (EMIs) by the due date.</p>
          <p><strong>4. Data Usage:</strong> You consent to the collection and usage of your personal and financial data for credit scoring and loan processing purposes.</p>
          <p><strong>5. Default:</strong> In case of default, the lender reserves the right to take legal action and report the default to credit bureaus.</p>
          <p><strong>6. Pre-payment:</strong> Pre-payment charges may apply as per the loan agreement.</p>
          <p><strong>7. Verification:</strong> All documents submitted are subject to verification. Any false information may lead to rejection of the application and legal action.</p>
          <p><strong>8. Communication:</strong> You agree to receive communications regarding your loan application via SMS, email, or phone.</p>
          <p><strong>9. Disbursement:</strong> The loan amount will be disbursed directly to your bank account upon sanction.</p>
          <p><strong>10. Changes:</strong> The lender reserves the right to amend these terms and conditions at any time without prior notice.</p>
        </div>
      </ScrollArea>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked as boolean)} />
        <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          I have read and agree to the Terms and Conditions
        </Label>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!accepted}>Next: Loan Details</Button>
      </div>
    </div>
  )
}
