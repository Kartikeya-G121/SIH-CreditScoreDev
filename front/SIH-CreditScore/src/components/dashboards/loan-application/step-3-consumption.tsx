"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, AlertCircle, Upload } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns"
import BillUpload from "@/components/dashboards/bill-upload"
import { toast } from "@/hooks/use-toast"

interface Step3Props {
  applicationId: number
  onSubmit: () => void
  onBack: () => void
}

type ConsumptionEntry = {
  entryId: number
  dataSource: string
  billingDate: string
  billingAmount: number
  verificationStatus: string
}

const CATEGORIES = ["ELECTRICITY", "WATER", "GAS"]

export function Step3ConsumptionGap({ applicationId, onSubmit, onBack }: Step3Props) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<ConsumptionEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Generate last 5 months
  const months = Array.from({ length: 5 }, (_, i) => subMonths(new Date(), i))

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const endDate = new Date().toISOString().split("T")[0]
      const startDate = subMonths(new Date(), 5).toISOString().split("T")[0]
      
      const res = await fetch(`/api/v1/consumption/history?startDate=${startDate}&endDate=${endDate}`)
      const data = await res.json()
      
      if (data.success) {
        setHistory(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch history", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const getEntryForMonth = (category: string, date: Date) => {
    return history.find(
      (h) =>
        h.dataSource === category &&
        h.billingDate &&
        isSameMonth(new Date(h.billingDate), date)
    )
  }

  const getMissingCount = (category: string) => {
    let count = 0;
    months.forEach(month => {
      if (!getEntryForMonth(category, month)) count++;
    });
    return count;
  }

  const handleBillUploaded = () => {
    toast({ title: "Bill Uploaded", description: "Refreshing your history..." })
    fetchHistory() // Refresh list
  }

  const handleSubmit = async () => {
    if (!confirmed) return;
    
    setSubmitting(true)
    try {
      // Call submit API
      const res = await fetch(`/api/v1/applications/${applicationId}/submit`, {
        method: "POST",
      })
      const data = await res.json()
      
      if (data.success) {
        onSubmit()
      } else {
        toast({ title: "Submission Failed", description: data.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit application", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Consumption History</h2>
        <p className="text-sm text-muted-foreground">
          We need your consumption bills for the last 5 months. Please upload any missing bills.
        </p>

        {/* Summary of Missing Bills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {CATEGORIES.map(cat => {
            const missing = getMissingCount(cat);
            return (
              <div key={cat} className={`p-3 rounded-md border ${missing > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <div className="font-semibold text-sm">{cat}</div>
                <div className="text-xs mt-1">
                  {missing === 0 ? (
                    <span className="text-green-700 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> All bills found</span>
                  ) : (
                    <span className="text-orange-700">Missing {missing} bills (Optional)</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                {CATEGORIES.map((cat) => (
                  <TableHead key={cat} className="text-center">{cat}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((month) => (
                <TableRow key={month.toISOString()}>
                  <TableCell className="font-medium">{format(month, "MMMM yyyy")}</TableCell>
                  {CATEGORIES.map((cat) => {
                    const entry = getEntryForMonth(cat, month)
                    return (
                      <TableCell key={cat} className="text-center">
                        {entry ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              ₹{entry.billingAmount}
                            </Badge>
                          </div>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                <Upload className="w-3 h-3 mr-1" /> Upload
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                              <BillUpload onBillConfirmed={handleBillUploaded} />
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center space-x-2 py-4 border-t">
        <Checkbox 
          id="confirm" 
          checked={confirmed} 
          onCheckedChange={(checked) => setConfirmed(checked as boolean)} 
        />
        <Label htmlFor="confirm" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          I confirm that I have uploaded all available bills and wish to submit my application.
        </Label>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSubmit} disabled={submitting || !confirmed}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Application
        </Button>
      </div>
    </div>
  )
}
