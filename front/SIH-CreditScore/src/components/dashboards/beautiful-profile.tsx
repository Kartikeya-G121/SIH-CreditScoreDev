'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    User,
    MapPin,
    Calendar,
    Users,
    GraduationCap,
    IndianRupee,
    FileText,
    Eye,
    Download,
    Upload,
    CheckCircle2,
    Trash2,
    RefreshCw,
    BarChart3,
    ShieldCheck,
    Landmark,
    ArrowRight
} from 'lucide-react';
import type { BeneficiaryProfile } from '@/types/beneficiary-types';

interface BeautifulProfileProps {
    profile: BeneficiaryProfile | null;
    user: any;
    savedBills?: any[];
    applications?: any[];
    onEditProfile: () => void;
    onManageDocuments: () => void;
    loading?: boolean;
}

export function BeautifulProfile({ profile, user, savedBills = [], applications = [], onEditProfile, onManageDocuments, loading }: BeautifulProfileProps) {
    const router = useRouter();

    const handleUploadBill = () => {
        router.push('/dashboard?tab=bill-upload');
    };

    const handleViewApplications = () => {
        router.push('/dashboard?tab=applications');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                        <User className="h-16 w-16 text-muted-foreground mx-auto" />
                        <div>
                            <h3 className="font-semibold text-lg">No Profile Found</h3>
                            <p className="text-muted-foreground mt-2">Please complete your profile to continue</p>
                        </div>
                        <Button onClick={onEditProfile}>Complete Profile</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate profile completion
    const calculateCompletion = () => {
        const fields = [
            profile.fullName,
            profile.dob,
            profile.gender,
            profile.addressLine,
            profile.district,
            profile.state,
            profile.pincode,
            profile.education,
            profile.incomeSource,
        ];
        const completed = fields.filter(f => f && f !== '').length;
        return Math.round((completed / fields.length) * 100);
    };

    const completion = calculateCompletion();
    const initials = profile.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    // Get top 3 recent applications
    const recentApplications = [...applications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
            case 'SANCTIONED':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'PENDING':
            case 'SUBMITTED':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const DocumentItem = ({ title, isUploaded, onUpload, onView, onReplace, onRemove }: any) => (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUploaded ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <FileText className={`h-5 w-5 ${isUploaded ? 'text-green-600' : 'text-slate-500'}`} />
                </div>
                <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className={`text-xs ${isUploaded ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        {isUploaded ? 'Uploaded' : 'Not Uploaded'}
                    </p>
                </div>
            </div>
            <div className="flex gap-1">
                {isUploaded ? (
                    <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={onView} title="View">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50" onClick={onReplace} title="Replace">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onRemove} title="Remove">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button size="sm" variant="outline" className="h-8 text-xs bg-white hover:bg-slate-50" onClick={onUpload}>
                        <Upload className="h-3 w-3 mr-1.5" />
                        Upload
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Minimal Header with Avatar */}
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-white shadow-lg ring-2 ring-slate-100">
                        <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{profile.fullName || user?.name || 'User'}</h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {user?.email || 'No email'}
                            </span>
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Beneficiary
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block mr-2">
                        <div className="text-sm font-medium text-slate-900">{completion}% Complete</div>
                        <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${completion}%` }} />
                        </div>
                    </div>
                    <Button onClick={onEditProfile} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Personal & Address */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                <User className="h-5 w-5 text-indigo-600" />
                                Personal & Address Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Personal Info Group */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                                        <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                        Personal Information
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                            <span className="text-sm text-muted-foreground">Date of Birth</span>
                                            <span className="text-sm font-medium">{profile.dob || 'Not provided'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                            <span className="text-sm text-muted-foreground">Gender</span>
                                            <span className="text-sm font-medium">{profile.gender || 'Not provided'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                            <span className="text-sm text-muted-foreground">Caste Category</span>
                                            <Badge variant="secondary" className="font-normal">{profile.casteCategory || 'N/A'}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                            <span className="text-sm text-muted-foreground">Aadhar Number</span>
                                            <span className="text-sm font-medium font-mono">{profile.aadharNumber || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Info Group */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                                        <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                        Address Details
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1 py-1 border-b border-slate-50">
                                            <span className="text-sm text-muted-foreground">Address Line</span>
                                            <span className="text-sm font-medium truncate" title={profile.addressLine}>{profile.addressLine || 'Not provided'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-0.5">District</span>
                                                <span className="text-sm font-medium">{profile.district || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-0.5">State</span>
                                                <span className="text-sm font-medium">{profile.state || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-0.5">Pincode</span>
                                                <span className="text-sm font-medium">{profile.pincode || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block mb-0.5">Region</span>
                                                <Badge variant="outline" className="text-xs font-normal">{profile.regionType || 'RURAL'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Documents */}
                <div className="lg:col-span-1">
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                    <FileText className="h-5 w-5 text-orange-600" />
                                    Documents
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <DocumentItem
                                title="Caste Certificate"
                                isUploaded={!!profile.casteCertificateUrl}
                                onUpload={onManageDocuments}
                                onView={onManageDocuments}
                                onReplace={onManageDocuments}
                                onRemove={onManageDocuments}
                            />
                            <DocumentItem
                                title="Identity Proof"
                                isUploaded={!!profile.identityProofUrl}
                                onUpload={onManageDocuments}
                                onView={onManageDocuments}
                                onReplace={onManageDocuments}
                                onRemove={onManageDocuments}
                            />

                            <div className="pt-2">
                                <Button variant="outline" className="w-full text-xs" onClick={onManageDocuments}>
                                    Manage All Documents
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Socio-Economic Details - Compact & Centric */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-center gap-2 text-lg text-slate-800">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        Socio-Economic Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{profile.familySize || 0}</span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Family Size</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{profile.dependencyCount || 0}</span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dependents</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                                <GraduationCap className="h-5 w-5 text-purple-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 text-center line-clamp-1">{profile.education || 'N/A'}</span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Education</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                                <IndianRupee className="h-5 w-5 text-orange-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 text-center line-clamp-1">{profile.incomeSource || 'N/A'}</span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Income Source</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Split Section: Utility Bills & Recent Applications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Utility Bills Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-semibold text-slate-900">Utility Bills</h3>
                        {savedBills.length > 0 && (
                            <Button variant="link" className="text-indigo-600 h-auto p-0" onClick={handleUploadBill}>View All History</Button>
                        )}
                    </div>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-white h-full">
                        <CardContent className="p-6 flex flex-col justify-center h-full">
                            {savedBills.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                        <div className="text-3xl font-bold text-indigo-600 mb-1">{savedBills.length}</div>
                                        <div className="text-sm font-medium text-muted-foreground">Total Bills</div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                        <div className="text-3xl font-bold text-emerald-600 mb-1">{savedBills.length}</div>
                                        <div className="text-sm font-medium text-muted-foreground">Verified</div>
                                    </div>

                                    <div className="col-span-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                        <div className="text-3xl font-bold text-purple-600 mb-1">100%</div>
                                        <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">No Utility Bills</h3>
                                    <p className="text-muted-foreground text-sm mt-2 mb-6">
                                        Upload bills to build credit history.
                                    </p>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full" onClick={handleUploadBill}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload First Bill
                                    </Button>
                                </div>
                            )}

                            {savedBills.length > 0 && (
                                <div className="mt-6 flex justify-center">
                                    <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full" onClick={handleUploadBill}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload More Bills
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Applications Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-semibold text-slate-900">Recent Applications</h3>
                        {applications.length > 0 && (
                            <Button variant="link" className="text-indigo-600 h-auto p-0" onClick={handleViewApplications}>View All</Button>
                        )}
                    </div>

                    <Card className="border-0 shadow-md bg-white h-full">
                        <CardContent className="p-6 h-full">
                            {recentApplications.length > 0 ? (
                                <div className="space-y-3">
                                    {recentApplications.map((app) => (
                                        <div key={app.applicationId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Landmark className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-slate-900">Loan #{app.applicationId}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`${getStatusColor(app.status)} text-[10px] px-2 py-0.5`}>
                                                {app.status}
                                            </Badge>
                                        </div>
                                    ))}

                                    <Button variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 mt-2" onClick={handleViewApplications}>
                                        View All Applications <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 flex flex-col justify-center h-full">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Landmark className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">New User?</h3>
                                    <p className="text-muted-foreground text-sm mt-2 mb-6">
                                        You haven't applied for any loans yet. Check out our schemes.
                                    </p>
                                    <Button className="bg-slate-900 hover:bg-slate-800 text-white w-full" onClick={() => router.push('/dashboard?tab=schemes')}>
                                        View Loan Schemes
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
