"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Step0LoanType } from "./step-0-loan-type"
import { StepTerms } from "./step-terms"
import { Step1ApplicationDetails } from "./step-1-details"
import { Step2BeneficiaryReview } from "./step-2-beneficiary"
import { Step3ConsumptionGap } from "./step-3-consumption"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function LoanApplicationWizard() {
  const [step, setStep] = useState(0); // 0: Type, 1: Terms, 2: Details, 3: Beneficiary, 4: Consumption
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const router = useRouter();

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleLoanTypeSelect = (type: 'individual' | 'group') => {
    if (type === 'group') {
      toast({
        title: "Coming Soon",
        description: "Group loan applications are currently under development.",
      });
      // Optionally redirect to group dashboard
      // router.push("/dashboard?tab=group-lending");
    } else {
      handleNext();
    }
  };

  const handleComplete = () => {
    toast({
      title: "Application Submitted",
      description: "Your loan application has been submitted successfully.",
    });
    router.push("/dashboard"); // Redirect to dashboard or my-applications
  };

  // Helper to render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { num: 0, label: "Type" },
      { num: 1, label: "Terms" },
      { num: 2, label: "Details" },
      { num: 3, label: "Profile" },
      { num: 4, label: "Docs" }
    ];

    return (
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        {steps.map((s) => (
          <div key={s.num} className="flex flex-col items-center">
             <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= s.num
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s.num + 1}
            </div>
            <span className="text-xs mt-1 text-muted-foreground hidden sm:block">{s.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Apply for Loan</h1>
        <p className="text-muted-foreground">
          Complete the following steps to submit your loan application.
        </p>
      </div>

      {renderStepIndicator()}

      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <Step0LoanType onNext={handleLoanTypeSelect} />
          )}
          {step === 1 && (
            <StepTerms onNext={handleNext} onBack={handleBack} />
          )}
          {step === 2 && (
            <Step1ApplicationDetails
              onNext={(id) => {
                setApplicationId(id);
                handleNext();
              }}
            />
          )}
          {step === 3 && (
            <Step2BeneficiaryReview onNext={handleNext} onBack={handleBack} />
          )}
          {step === 4 && (
            <Step3ConsumptionGap
              applicationId={applicationId!}
              onSubmit={handleComplete}
              onBack={handleBack}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
