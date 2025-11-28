'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { MOCK_BENEFICIARY_DATA } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Info } from 'lucide-react';

export default function ScoreExplainability() {
  const { t } = useLanguage();
  const { xaiSummary, creditScore, riskLevel } = MOCK_BENEFICIARY_DATA;
  const [isSimplified, setIsSimplified] = useState(true);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-[#1F3D7A] via-[#1CA676] to-[#F6A623] p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] opacity-80">
            {t('sidebar_xai')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            {t('composite_score_card_title')}
          </h2>
          <p className="mt-2 text-sm text-white/80">
            AI explains how your score of {creditScore} was derived with zero bias.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs uppercase opacity-80">Risk Cluster</p>
            <p className="text-xl font-bold">{riskLevel}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur">
            <Info className="h-4 w-4" />
            RBI Auditable
          </div>
          <Button variant="secondary" className="bg-white text-[#1F3D7A]">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('feature_contributions')}</CardTitle>
            <CardDescription>
              Quantitative view of how each signal influenced the composite score.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t('simplified_view')}</span>
            <Switch checked={isSimplified} onCheckedChange={setIsSimplified} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSimplified && (
            <div className="grid gap-4 md:grid-cols-2">
              {xaiSummary.highlights.map((card) => (
                <div key={card.title} className="rounded-xl border p-4">
                  <p className="text-sm font-semibold text-primary">{card.title}</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {card.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {isSimplified && (
            <div className="grid gap-4 md:grid-cols-3">
              {xaiSummary.simplified.map((item) => (
                <div key={item.title} className="rounded-xl bg-muted/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">{item.title}</p>
                  <p className="mt-2 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {xaiSummary.contributions.map((factor) => {
              const width = Math.min(factor.value, 100);
              const isPositive = factor.impact === 'positive';
              return (
                <div key={factor.feature}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{factor.feature}</span>
                    <Badge variant={isPositive ? 'outline' : 'destructive'}>
                      {isPositive ? '+ ' : '- '}
                      {factor.value} pts
                    </Badge>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

