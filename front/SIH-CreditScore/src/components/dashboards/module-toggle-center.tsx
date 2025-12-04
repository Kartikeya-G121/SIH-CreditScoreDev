'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

type EngineStatus = 'on' | 'off' | 'standby';

const baseModules = [
  {
    id: 'verification',
    title: 'Verification Engine',
    description: 'Real-time document fraud detection',
    status: 'on' as EngineStatus,
    costImpact: 18,
    uptime: '99.2%',
  },
  {
    id: 'rescoring',
    title: 'Re-Scoring Engine',
    description: 'Recompute score after new documents',
    status: 'standby' as EngineStatus,
    costImpact: 12,
    uptime: '98.0%',
  },
  {
    id: 'translation',
    title: 'Translation',
    description: 'Hindi, Tamil, Urdu coverage',
    status: 'on' as EngineStatus,
    costImpact: 9,
    uptime: '99.9%',
  },
];

const statusBadges: Record<EngineStatus, string> = {
  on: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  standby: 'bg-amber-50 text-amber-700 border-amber-200',
  off: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function ModuleToggleCenter() {
  const [modules, setModules] = useState(baseModules);

  const activeSavings = modules.reduce(
    (acc, mod) => (mod.status === 'standby' ? acc + mod.costImpact : acc),
    0
  );

  const handleToggle = (id: string) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id !== id) return module;
        const nextStatus =
          module.status === 'on'
            ? 'standby'
            : module.status === 'standby'
              ? 'off'
              : 'on';
        return { ...module, status: nextStatus };
      })
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Module Toggle Center</CardTitle>
          <p className="text-sm text-muted-foreground">
            Optimize cost by placing engines into smart standby.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          {activeSavings}% cost saved today
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress
          value={activeSavings}
          className="h-2"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((module) => (
            <div key={module.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{module.title}</p>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <Switch
                  checked={module.status !== 'off'}
                  onCheckedChange={() => handleToggle(module.id)}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <Badge variant="outline" className={statusBadges[module.status]}>
                  {module.status === 'on'
                    ? 'ON'
                    : module.status === 'standby'
                      ? 'Standby'
                      : 'Off'}
                </Badge>
                <span className="text-muted-foreground">Uptime {module.uptime}</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Cost impact: <span className="font-semibold text-primary">₹{module.costImpact}K / month</span>
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

