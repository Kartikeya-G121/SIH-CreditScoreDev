'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
    Loader2, Search, Filter, X, ChevronLeft, ChevronRight,
    Ban, CheckCircle, Download, Eye, SlidersHorizontal, UserCog
} from 'lucide-react';
import { adminService, UserSearchFilters, UserSearchResponse, UserSearchResult } from '@/services/admin-service';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface AdvancedUserSearchProps {
    onStatsUpdate?: () => void;
}

export default function AdvancedUserSearch({ onStatsUpdate }: AdvancedUserSearchProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<UserSearchResponse | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [updatingRole, setUpdatingRole] = useState(false);

    // Filter state
    const [filters, setFilters] = useState<UserSearchFilters>({
        page: 0,
        size: 20,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
    });

    // Perform search
    const handleSearch = async () => {
        try {
            setLoading(true);
            const results = await adminService.advancedUserSearch(filters);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            toast({
                variant: 'destructive',
                title: 'Search Failed',
                description: 'Failed to search users. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle filter change
    const updateFilter = (key: keyof UserSearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            page: 0,
            size: 20,
            sortBy: 'createdAt',
            sortDirection: 'DESC',
        });
        setSearchResults(null);
    };

    // Clear only advanced filters
    const clearAdvancedFilters = () => {
        setFilters(prev => ({
            ...prev,
            regionType: undefined,
            state: undefined,
            district: undefined,
            casteCategory: undefined,
            gender: undefined,
            page: 0,
        }));
    };

    // Handle pagination
    const goToPage = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    // View user details
    const handleViewDetails = (user: UserSearchResult) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setShowDetailsDialog(true);
    };

    // Handle role update
    const handleUpdateRole = async () => {
        if (!selectedUser || !selectedRole) return;

        try {
            setUpdatingRole(true);
            await adminService.updateUserRoleById(selectedUser.userId, selectedRole);
            toast({
                title: 'Role Updated',
                description: `User role has been updated to ${selectedRole} successfully.`,
            });
            setShowDetailsDialog(false);
            handleSearch();
            onStatsUpdate?.();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Failed to update user role.',
            });
        } finally {
            setUpdatingRole(false);
        }
    };

    // Handle block/unblock
    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        try {
            await adminService.toggleUserStatus(userId);
            toast({
                title: currentStatus ? 'User Blocked' : 'User Unblocked',
                description: `User has been ${currentStatus ? 'blocked' : 'unblocked'} successfully.`,
            });
            setShowDetailsDialog(false);
            handleSearch();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: 'Failed to update user status.',
            });
        }
    };

    // Export to CSV
    const exportToCSV = () => {
        if (!searchResults || searchResults.users.length === 0) return;

        const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'State', 'District', 'Region', 'Gender', 'Caste'];
        const rows = searchResults.users.map(user => [
            user.userId,
            user.fullName || '-',
            user.email,
            user.phoneNumber,
            user.role,
            user.isActive ? 'Active' : 'Blocked',
            user.state || '-',
            user.district || '-',
            user.regionType || '-',
            user.gender || '-',
            user.casteCategory || '-',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Count active advanced filters
    const activeAdvancedFiltersCount = [
        filters.regionType,
        filters.state,
        filters.district,
        filters.casteCategory,
        filters.gender,
    ].filter(Boolean).length;

    // Auto-search when filters change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (Object.keys(filters).length > 4) {
                handleSearch();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Search</h2>
                    <p className="text-muted-foreground">Search and manage users</p>
                </div>
            </div>

            {/* Main Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search Filters</CardTitle>
                    <CardDescription>Filter users by basic criteria</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Text Search */}
                        <div className="space-y-2">
                            <Label>Search Text</Label>
                            <Input
                                placeholder="Email or phone..."
                                value={filters.searchText || ''}
                                onChange={(e) => updateFilter('searchText', e.target.value)}
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={filters.role || 'all'} onValueChange={(val) => updateFilter('role', val === 'all' ? undefined : val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="BENEFICIARY">Beneficiary</SelectItem>
                                    <SelectItem value="LOAN_OFFICER">Loan Officer</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                                onValueChange={(val) => updateFilter('isActive', val === 'all' ? undefined : val === 'true')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Blocked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Advanced Filters Button */}
                        <div className="space-y-2">
                            <Label>Profile Filters</Label>
                            <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="w-full relative">
                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                        Advanced Filters
                                        {activeAdvancedFiltersCount > 0 && (
                                            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                                                {activeAdvancedFiltersCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Advanced Profile Filters</SheetTitle>
                                        <SheetDescription>
                                            Filter users by beneficiary profile information
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="space-y-4 mt-6">
                                        {/* Region Type */}
                                        <div className="space-y-2">
                                            <Label>Region Type</Label>
                                            <Select value={filters.regionType || 'all'} onValueChange={(val) => updateFilter('regionType', val === 'all' ? undefined : val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Regions" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Regions</SelectItem>
                                                    <SelectItem value="RURAL">Rural</SelectItem>
                                                    <SelectItem value="URBAN">Urban</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* State */}
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Input
                                                placeholder="e.g., Maharashtra"
                                                value={filters.state || ''}
                                                onChange={(e) => updateFilter('state', e.target.value || undefined)}
                                            />
                                        </div>

                                        {/* District */}
                                        <div className="space-y-2">
                                            <Label>District</Label>
                                            <Input
                                                placeholder="e.g., Pune"
                                                value={filters.district || ''}
                                                onChange={(e) => updateFilter('district', e.target.value || undefined)}
                                            />
                                        </div>

                                        {/* Gender */}
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <Select value={filters.gender || 'all'} onValueChange={(val) => updateFilter('gender', val === 'all' ? undefined : val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Genders" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Genders</SelectItem>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Caste Category */}
                                        <div className="space-y-2">
                                            <Label>Caste Category</Label>
                                            <Select value={filters.casteCategory || 'all'} onValueChange={(val) => updateFilter('casteCategory', val === 'all' ? undefined : val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Categories" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Categories</SelectItem>
                                                    <SelectItem value="SC">SC</SelectItem>
                                                    <SelectItem value="ST">ST</SelectItem>
                                                    <SelectItem value="OBC">OBC</SelectItem>
                                                    <SelectItem value="General">General</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button variant="outline" onClick={clearAdvancedFilters} className="flex-1">
                                                <X className="h-4 w-4 mr-2" />
                                                Clear
                                            </Button>
                                            <Button onClick={() => setShowAdvancedFilters(false)} className="flex-1">
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                        <Button variant="outline" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {searchResults && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Search Results</CardTitle>
                                <CardDescription>
                                    Found {searchResults.totalElements} users
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={searchResults.users.length === 0}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searchResults.users.map((user) => (
                                    <TableRow key={user.userId}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.phoneNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isBlacklisted ? 'destructive' : 'default'}>
                                                {user.isBlacklisted ? 'Blocked' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetails(user)}
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> View More
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {searchResults.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {searchResults.currentPage + 1} of {searchResults.totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(searchResults.currentPage - 1)}
                                        disabled={searchResults.currentPage === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(searchResults.currentPage + 1)}
                                        disabled={searchResults.currentPage >= searchResults.totalPages - 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!searchResults && !loading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Search className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No search performed yet</p>
                        <p className="text-sm text-muted-foreground">Apply filters and click Search to find users</p>
                    </CardContent>
                </Card>
            )}

            {/* User Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>Complete information about the user</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">User ID</Label>
                                    <p className="font-medium">{selectedUser.userId}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div>
                                        <Badge variant={selectedUser.isBlacklisted ? 'destructive' : 'default'}>
                                            {selectedUser.isBlacklisted ? 'Blocked' : 'Active'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Full Name</Label>
                                    <p className="font-medium">{selectedUser.fullName || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{selectedUser.phoneNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Role</Label>
                                    <p className="font-medium">{selectedUser.role}</p>
                                </div>
                            </div>

                            {/* Profile Info */}
                            {(selectedUser.state || selectedUser.gender) && (
                                <>
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-3">Profile Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedUser.state && (
                                                <div>
                                                    <Label className="text-muted-foreground">State</Label>
                                                    <p className="font-medium">{selectedUser.state}</p>
                                                </div>
                                            )}
                                            {selectedUser.district && (
                                                <div>
                                                    <Label className="text-muted-foreground">District</Label>
                                                    <p className="font-medium">{selectedUser.district}</p>
                                                </div>
                                            )}
                                            {selectedUser.regionType && (
                                                <div>
                                                    <Label className="text-muted-foreground">Region Type</Label>
                                                    <p className="font-medium">{selectedUser.regionType}</p>
                                                </div>
                                            )}
                                            {selectedUser.gender && (
                                                <div>
                                                    <Label className="text-muted-foreground">Gender</Label>
                                                    <p className="font-medium">{selectedUser.gender}</p>
                                                </div>
                                            )}
                                            {selectedUser.casteCategory && (
                                                <div>
                                                    <Label className="text-muted-foreground">Caste Category</Label>
                                                    <p className="font-medium">{selectedUser.casteCategory}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Role Assignment */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Role Management</h4>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <Label>Assign Role</Label>
                                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BENEFICIARY">Beneficiary</SelectItem>
                                                <SelectItem value="LOAN_OFFICER">Loan Officer</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="AUDITOR">Auditor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={handleUpdateRole}
                                        disabled={updatingRole || selectedRole === selectedUser.role}
                                    >
                                        {updatingRole ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
                                        ) : (
                                            <><UserCog className="h-4 w-4 mr-2" /> Update Role</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t pt-4 flex gap-2">
                                <Button
                                    variant={selectedUser.isBlacklisted ? 'default' : 'destructive'}
                                    onClick={() => handleToggleStatus(selectedUser.userId, selectedUser.isBlacklisted)}
                                >
                                    {selectedUser.isBlacklisted ? (
                                        <><CheckCircle className="h-4 w-4 mr-2" /> Unblock User</>
                                    ) : (
                                        <><Ban className="h-4 w-4 mr-2" /> Block User</>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
