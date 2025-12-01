'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MOCK_DOCUMENT_VERIFICATIONS } from '@/lib/data';
import { ShieldCheck, AlertTriangle, Eye } from 'lucide-react';

const statusCopy = {
  valid: {
    label: 'Valid',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  suspicious: {
    label: 'Suspicious',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  forged: {
    label: 'Forged',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export default function DocumentVerificationWorkspace() {
  const [activeDoc, setActiveDoc] = useState(MOCK_DOCUMENT_VERIFICATIONS[0]);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState('');
  const { toast } = useToast();

  const handleOverride = () => {
    toast({
      title: 'Override submitted',
      description: `Manual decision logged for ${activeDoc.applicant}.`,
    });
    setOverrideNotes('');
    setOverrideOpen(false);
  };

  const status = statusCopy[activeDoc.statusBadge as keyof typeof statusCopy];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Document Verification Workspace</CardTitle>
          <CardDescription>
            Side-by-side preview, metadata checks, and officer overrides.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <ScrollArea className="h-96 rounded-xl border">
            <div className="space-y-3 p-4">
              {MOCK_DOCUMENT_VERIFICATIONS.map((doc) => {
                const currentStatus = statusCopy[doc.statusBadge as keyof typeof statusCopy];
                const isActive = activeDoc.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveDoc(doc)}
                    className={`w-full rounded-xl border p-3 text-left transition hover:border-primary ${isActive ? 'border-primary shadow-md' : ''}`}
                  >
                    <p className="text-sm font-semibold">{doc.applicant}</p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                    <Badge variant="outline" className={`mt-2 ${currentStatus.className}`}>
                      {currentStatus.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="space-y-4 rounded-2xl border p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-slate-950/90 p-6 text-white shadow-inner">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                  <span className="text-xs uppercase tracking-widest">
                    {activeDoc.channel}
                  </span>
                </div>
                <div className="mt-10 flex flex-col gap-2">
                  <p className="text-lg font-semibold">{activeDoc.type}</p>
                  <p className="text-sm text-white/70">{activeDoc.number}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
                    <Eye className="h-4 w-4" />
                    {activeDoc.uploadedAt}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {activeDoc.metadata.map((item) => (
                  <div key={item.label} className="rounded-lg border p-3">
                    <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {activeDoc.anomalies.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Anomaly Signals
                </div>
                <ul className="list-disc space-y-1 pl-5">
                  {activeDoc.anomalies.map((anomaly) => (
                    <li key={anomaly}>{anomaly}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  No anomalies detected
                </div>
                <p className="mt-1 text-xs">
                  OCR, geo-tag, and issuer verification all cleared.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline">Mark Valid</Button>
              <Button
                variant={activeDoc.statusBadge === 'forged' ? 'destructive' : 'default'}
                onClick={() => setOverrideOpen(true)}
              >
                Override Decision
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Officer Override</DialogTitle>
            <DialogDescription>
              Provide justification to supersede AI decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="override-notes">Comments</Label>
              <Textarea
                id="override-notes"
                placeholder="Add context for the override..."
                value={overrideNotes}
                onChange={(event) => setOverrideNotes(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOverride} disabled={!overrideNotes}>
              Submit Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

