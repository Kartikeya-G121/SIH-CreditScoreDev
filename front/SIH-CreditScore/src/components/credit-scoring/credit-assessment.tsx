'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, CheckCircle, AlertTriangle, TrendingUp, FileText } from 'lucide-react';

interface CreditAssessmentProps {
  beneficiaryId: string;
}

export default function CreditAssessment({ beneficiaryId }: CreditAssessmentProps) {
  const [riskScore] = useState(72);
  const [incomeScore] = useState(68);
  const [compositeScore] = useState(70);
  const [category] = useState('Normal Lending');

  const explanations = [
    { factor: 'Utility Payment Consistency', impact: 'Positive', weight: 0.25 },
    { factor: 'Mobile Recharge Frequency', impact: 'Positive', weight: 0.20 },
    { factor: 'EMI History', impact: 'Neutral', weight: 0.30 },
    { factor: 'Income Verification', impact: 'Positive', weight: 0.25 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            UDAAN! Composite Credit Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{riskScore}</div>
              <div className="text-sm text-muted-foreground">Risk Score</div>
              <Progress value={riskScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{incomeScore}</div>
              <div className="text-sm text-muted-foreground">Income Score</div>
              <Progress value={incomeScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{compositeScore}</div>
              <div className="text-sm text-muted-foreground">Composite Score</div>
              <Badge variant="secondary" className="mt-2">{category}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="explanation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explanation">AI Explanation</TabsTrigger>
          <TabsTrigger value="verification">Document Status</TabsTrigger>
          <TabsTrigger value="suggestions">Improvements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="explanation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                K-Means Explainability Consensus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {explanations.map((exp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{exp.factor}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={exp.impact === 'Positive' ? 'default' : 'secondary'}>
                        {exp.impact}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Weight: {(exp.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bill Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Electricity Bill</span>
                  <Badge variant="default">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mobile Recharge History</span>
                  <Badge variant="default">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Income Documents</span>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Upload Recent Utility Bills</div>
                    <div className="text-sm text-muted-foreground">
                      Adding recent electricity bills can improve your income verification score
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Maintain Payment Consistency</div>
                    <div className="text-sm text-muted-foreground">
                      Continue regular utility payments to strengthen your profile
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4">
        <Button className="flex-1">Request Re-scoring</Button>
        <Button variant="outline" className="flex-1">Download Report</Button>
      </div>
    </div>
  );
}