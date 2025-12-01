"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Users } from "lucide-react"

interface Step0Props {
  onNext: (type: 'individual' | 'group') => void
}

export function Step0LoanType({ onNext }: Step0Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNext('individual')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Individual Loan
          </CardTitle>
          <CardDescription>
            Apply for a personal loan for your business or consumption needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Higher loan limits</li>
            <li>Flexible repayment terms</li>
            <li>Based on your credit score</li>
          </ul>
          <Button className="w-full mt-4">Select Individual Loan</Button>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNext('group')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Group Loan
          </CardTitle>
          <CardDescription>
            Apply as part of a Joint Liability Group (JLG).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Shared liability</li>
            <li>Lower interest rates</li>
            <li>Ideal for small groups</li>
          </ul>
          <Button variant="outline" className="w-full mt-4">Select Group Loan</Button>
        </CardContent>
      </Card>
    </div>
  )
}
