'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Users, User } from 'lucide-react';
import { ApplicationFormStep } from './application-form-step';
import { BeneficiaryDetailsStep } from './beneficiary-details-step';
import { ConsumptionUploadStep } from './consumption-upload-step';
import { GroupSelectionStep } from './group-selection-step';
import { GroupLoanDashboard } from './group-loan-dashboard';
import type { ApplicationFormData, BeneficiaryDetailsData, ApplicationWorkflowState, LoanType } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';

interface ApplyLoanPageProps {
    preSelectedSchemeId?: number;
    groupId?: number;
}

type WorkflowView = 'LOAN_TYPE_SELECT' | 'GROUP_SELECT' | 'GROUP_DASHBOARD' | 'APPLICATION_WIZARD';

export function ApplyLoanPage({ preSelectedSchemeId, groupId }: ApplyLoanPageProps) {
    const router = useRouter();
    const { toast } = useToast();

    // State for high-level workflow view
    const [currentView, setCurrentView] = useState<WorkflowView>('LOAN_TYPE_SELECT');
    const [loanType, setLoanType] = useState<LoanType>('INDIVIDUAL');
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(groupId);

    // State for the Application Wizard (Steps 1-3)
    const [workflowState, setWorkflowState] = useState<ApplicationWorkflowState>({
        currentStep: 1,
        applicationId: undefined,
        formData: null,
        beneficiaryData: null,
        billsData: [],
        preSelectedSchemeId,
    });

    // Initialize based on props
    useEffect(() => {
        if (groupId) {
            setLoanType('GROUP');
            setSelectedGroupId(groupId);
            setCurrentView('GROUP_DASHBOARD');
        } else if (preSelectedSchemeId) {
            // If scheme is pre-selected, assume individual loan for now or prompt user
            // For simplicity, let's start with Loan Type selection even if scheme is selected
            setCurrentView('LOAN_TYPE_SELECT');
        }
    }, [groupId, preSelectedSchemeId]);

    // --- Workflow Handlers ---

    const handleLoanTypeSelect = (type: LoanType) => {
        setLoanType(type);
        if (type === 'GROUP') {
            setCurrentView('GROUP_SELECT');
        } else {
            setCurrentView('APPLICATION_WIZARD');
        }
    };

    const handleGroupSelect = (groupId: number) => {
        setSelectedGroupId(groupId);
        setCurrentView('GROUP_DASHBOARD');
    };

    const handleDraftApplication = () => {
        // Start the wizard in Group context
        setWorkflowState(prev => ({ ...prev, currentStep: 1 }));
        setCurrentView('APPLICATION_WIZARD');
    };

    // --- Wizard Step Handlers ---

    const handleStep1Next = (formData: ApplicationFormData, applicationId: number) => {
        setWorkflowState(prev => ({
            ...prev,
            currentStep: 2,
            formData,
            applicationId,
        }));
    };

    const handleStep2Next = (beneficiaryData: BeneficiaryDetailsData) => {
        setWorkflowState(prev => ({
            ...prev,
            currentStep: 3,
            beneficiaryData,
        }));
    };

    const handleStep2Back = () => {
        setWorkflowState(prev => ({
            ...prev,
            currentStep: 1,
        }));
    };

    const handleStep3Back = () => {
        setWorkflowState(prev => ({
            ...prev,
            currentStep: 2,
        }));
    };

    const handleApplicationSubmit = () => {
        if (loanType === 'GROUP') {
            toast({
                title: 'Draft Saved',
                description: 'Your application draft has been saved. Returning to Group Dashboard.',
            });
            setCurrentView('GROUP_DASHBOARD');
        } else {
            toast({
                title: 'Success!',
                description: 'Your loan application has been submitted successfully.',
            });
            // Redirect to dashboard overview
            setTimeout(() => {
                router.push('/dashboard?tab=overview');
            }, 2000);
        }
    };

    // --- Render Helpers ---

    const renderLoanTypeSelection = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Start Loan Application</h2>
                <p className="text-muted-foreground mt-2">Choose how you want to apply for the loan</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card
                    className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                    onClick={() => handleLoanTypeSelect('INDIVIDUAL')}
                >
                    <CardHeader>
                        <User className="h-12 w-12 text-primary mb-2" />
                        <CardTitle>Individual Loan</CardTitle>
                        <CardDescription>
                            Apply for a loan as an individual beneficiary.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Standard application process</li>
                            <li>Based on your personal credit score</li>
                            <li>Direct disbursement to your account</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                    onClick={() => handleLoanTypeSelect('GROUP')}
                >
                    <CardHeader>
                        <Users className="h-12 w-12 text-blue-600 mb-2" />
                        <CardTitle>Group Loan</CardTitle>
                        <CardDescription>
                            Apply together with your Self Help Group.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Higher approval chances</li>
                            <li>Shared responsibility</li>
                            <li>Larger loan amounts possible</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const steps = [
        { number: 1, title: 'Application Details', description: 'Loan information' },
        { number: 2, title: 'Beneficiary Details', description: 'Personal information' },
        { number: 3, title: 'Upload Bills', description: 'Consumption data' },
    ];

    // --- Main Render ---

    if (currentView === 'LOAN_TYPE_SELECT') {
        return renderLoanTypeSelection();
    }

    if (currentView === 'GROUP_SELECT') {
        return (
            <GroupSelectionStep
                onGroupSelect={handleGroupSelect}
                onBack={() => setCurrentView('LOAN_TYPE_SELECT')}
            />
        );
    }

    if (currentView === 'GROUP_DASHBOARD' && selectedGroupId) {
        return (
            <GroupLoanDashboard
                groupId={selectedGroupId}
                onDraftApplication={handleDraftApplication}
                onBack={() => setCurrentView('GROUP_SELECT')}
            />
        );
    }

    // Wizard View
    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (loanType === 'GROUP') {
                            setCurrentView('GROUP_DASHBOARD');
                        } else {
                            setCurrentView('LOAN_TYPE_SELECT');
                        }
                    }}
                >
                    ← Back to {loanType === 'GROUP' ? 'Group Dashboard' : 'Selection'}
                </Button>
                {loanType === 'GROUP' && (
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        Applying as Group Member
                    </span>
                )}
            </div>

            {/* Progress Indicator */}
            <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center flex-1">
                                {/* Step Circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${step.number < workflowState.currentStep
                                            ? 'bg-green-600 border-green-600 text-white'
                                            : step.number === workflowState.currentStep
                                                ? 'bg-primary border-primary text-white'
                                                : 'bg-background border-muted-foreground/30 text-muted-foreground'
                                            }`}
                                    >
                                        {step.number < workflowState.currentStep ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <span className="font-semibold">{step.number}</span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p
                                            className={`text-sm font-medium ${step.number <= workflowState.currentStep
                                                ? 'text-foreground'
                                                : 'text-muted-foreground'
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground hidden sm:block">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-4 -mt-8">
                                        <div
                                            className={`h-full transition-all ${step.number < workflowState.currentStep
                                                ? 'bg-green-600'
                                                : 'bg-muted-foreground/30'
                                                }`}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Step Content */}
            <div className="animate-in fade-in-50 duration-300">
                {workflowState.currentStep === 1 && (
                    <ApplicationFormStep
                        preSelectedSchemeId={preSelectedSchemeId}
                        groupId={selectedGroupId}
                        onNext={handleStep1Next}
                        initialData={workflowState.formData || undefined}
                        isGroupLoan={loanType === 'GROUP'}
                    />
                )}

                {workflowState.currentStep === 2 && (
                    <BeneficiaryDetailsStep
                        onNext={handleStep2Next}
                        onBack={handleStep2Back}
                    />
                )}

                {workflowState.currentStep === 3 && workflowState.applicationId && (
                    <ConsumptionUploadStep
                        applicationId={workflowState.applicationId}
                        onBack={handleStep3Back}
                        onSubmit={handleApplicationSubmit}
                        isGroupLoan={loanType === 'GROUP'}
                    />
                )}
            </div>
        </div>
    );
}
